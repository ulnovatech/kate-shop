-- Chunk 10: Guest checkout — customers upsert, confirmation lookup, session hook

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_session_id text;

CREATE INDEX IF NOT EXISTS orders_checkout_session_id_idx
  ON public.orders (checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Upsert customer by normalized phone (service role / checkout RPC only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_customer(
  p_phone text,
  p_name text,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_phone IS NULL OR length(trim(p_phone)) < 9 THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  INSERT INTO public.customers (phone, name, email)
  VALUES (trim(p_phone), COALESCE(NULLIF(trim(p_name), ''), 'Customer'), NULLIF(trim(p_email), ''))
  ON CONFLICT (phone) DO UPDATE
  SET
    name       = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
    email      = COALESCE(NULLIF(EXCLUDED.email, ''), customers.email),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Checkout: order + reservation + customer link
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean
);

CREATE OR REPLACE FUNCTION public.create_order_with_reservation(
  p_customer_name text,
  p_phone text,
  p_address text DEFAULT '',
  p_notes text DEFAULT '',
  p_subtotal numeric DEFAULT 0,
  p_delivery_fee numeric DEFAULT 0,
  p_grand_total numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_delivery_zone_id uuid DEFAULT NULL,
  p_delivery_area text DEFAULT '',
  p_express_delivery boolean DEFAULT false,
  p_cash_on_delivery boolean DEFAULT false,
  p_email text DEFAULT NULL,
  p_checkout_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_customer_id uuid;
  v_ref text;
  item jsonb;
  agg record;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  v_customer_id := public.upsert_customer(p_phone, p_customer_name, p_email);
  v_ref := public.generate_order_reference();

  INSERT INTO public.orders (
    customer_id, customer_name, phone, email, address, notes,
    total, subtotal, delivery_fee, grand_total,
    delivery_zone_id, delivery_area,
    express_delivery, cash_on_delivery, checkout_session_id,
    status, order_status, payment_status,
    order_reference, inventory_state
  )
  VALUES (
    v_customer_id, p_customer_name, p_phone, NULLIF(trim(p_email), ''), COALESCE(p_address, ''), COALESCE(p_notes, ''),
    p_grand_total, p_subtotal, p_delivery_fee, p_grand_total,
    p_delivery_zone_id, NULLIF(p_delivery_area, ''),
    p_express_delivery, p_cash_on_delivery, NULLIF(p_checkout_session_id, ''),
    'pending', 'awaiting_payment'::public.order_status, 'pending'::public.payment_status,
    v_ref, 'none'
  )
  RETURNING id INTO v_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, name, price, quantity)
    VALUES (
      v_order_id,
      NULLIF(item->>'product_id', '')::uuid,
      item->>'name',
      (item->>'price')::numeric,
      GREATEST(1, (item->>'quantity')::int)
    );
  END LOOP;

  FOR agg IN
    SELECT
      (elem->>'product_id')::uuid AS product_id,
      SUM(GREATEST(1, (elem->>'quantity')::int))::int AS qty
    FROM jsonb_array_elements(p_items) AS elem
    WHERE NULLIF(elem->>'product_id', '') IS NOT NULL
    GROUP BY 1
  LOOP
    PERFORM public._reserve_product_stock(agg.product_id, agg.qty, v_order_id);
  END LOOP;

  UPDATE public.orders
  SET inventory_state = 'reserved', updated_at = now()
  WHERE id = v_order_id;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, note)
  VALUES (v_order_id, NULL, 'awaiting_payment'::public.order_status, 'Order placed on website');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_reference', v_ref,
    'customer_id', v_customer_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Public confirmation lookup (reference only — no PII beyond what customer entered)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_order_confirmation(p_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  o record;
  items jsonb;
BEGIN
  SELECT
    id, order_reference, customer_name, phone, email,
    delivery_area, address, notes,
    subtotal, delivery_fee, grand_total,
    express_delivery, cash_on_delivery,
    order_status, payment_status, created_at
  INTO o
  FROM public.orders
  WHERE order_reference = p_reference
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', oi.name,
      'quantity', oi.quantity,
      'price', oi.price
    ) ORDER BY oi.name
  ), '[]'::jsonb)
  INTO items
  FROM public.order_items oi
  WHERE oi.order_id = o.id;

  RETURN jsonb_build_object(
    'order_reference', o.order_reference,
    'customer_name', o.customer_name,
    'phone', o.phone,
    'email', o.email,
    'delivery_area', o.delivery_area,
    'address', o.address,
    'notes', o.notes,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'grand_total', o.grand_total,
    'express_delivery', o.express_delivery,
    'cash_on_delivery', o.cash_on_delivery,
    'order_status', o.order_status,
    'payment_status', o.payment_status,
    'created_at', o.created_at,
    'items', items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_customer(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean, text, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_order_confirmation(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_customer(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean, text, text
) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_order_confirmation(text) TO anon, authenticated, service_role;

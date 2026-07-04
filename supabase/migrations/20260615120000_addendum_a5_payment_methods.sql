-- Addendum A5: DB-driven payment methods (enable/disable, reorder at checkout)

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payment_methods (provider, label, description, is_enabled, sort_order)
VALUES
  ('mtn_momo', 'MTN MoMo', 'Pay with MTN Mobile Money', true, 0),
  ('airtel_money', 'Airtel Money', 'Pay with Airtel Money', true, 1),
  ('bank_transfer', 'Bank transfer', 'Pay via bank transfer', true, 2),
  ('cash_on_delivery', 'Cash on delivery', 'Pay when your order arrives', true, 3)
ON CONFLICT (provider) DO NOTHING;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preferred_payment_provider public.payment_provider;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_methods_public_select ON public.payment_methods;
CREATE POLICY payment_methods_public_select ON public.payment_methods
  FOR SELECT TO anon, authenticated
  USING (is_enabled = true);

DROP POLICY IF EXISTS payment_methods_staff_all ON public.payment_methods;
CREATE POLICY payment_methods_staff_all ON public.payment_methods
  FOR ALL TO authenticated
  USING (public.is_staff_member(auth.uid()))
  WITH CHECK (public.is_staff_member(auth.uid()));

GRANT SELECT ON public.payment_methods TO anon, authenticated;
GRANT ALL ON public.payment_methods TO service_role;

-- ---------------------------------------------------------------------------
-- Checkout: persist preferred payment method on orders
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean, text, text
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
  p_checkout_session_id text DEFAULT NULL,
  p_preferred_payment_provider public.payment_provider DEFAULT NULL
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
  v_mode text;
  v_has_shortfall boolean := false;
  v_available int;
  v_initial_status public.order_status;
  v_event_note text;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  IF p_preferred_payment_provider IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payment_methods
      WHERE provider = p_preferred_payment_provider
        AND is_enabled = true
    ) THEN
      RAISE EXCEPTION 'Selected payment method is not available';
    END IF;
  END IF;

  v_mode := public.get_store_inventory_mode();

  FOR agg IN
    SELECT
      (elem->>'product_id')::uuid AS product_id,
      SUM(GREATEST(1, (elem->>'quantity')::int))::int AS qty
    FROM jsonb_array_elements(p_items) AS elem
    WHERE NULLIF(elem->>'product_id', '') IS NOT NULL
    GROUP BY 1
  LOOP
    SELECT available_stock INTO v_available
    FROM public.products
    WHERE id = agg.product_id
      AND is_active = true
      AND archived_at IS NULL
      AND deleted_at IS NULL;

    IF NOT FOUND OR v_available < agg.qty THEN
      v_has_shortfall := true;
      EXIT;
    END IF;
  END LOOP;

  IF v_has_shortfall AND v_mode = 'strict' THEN
    RAISE EXCEPTION 'Insufficient stock for one or more items'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_has_shortfall AND v_mode = 'backorder' THEN
    v_initial_status := 'awaiting_stock_confirmation'::public.order_status;
    v_event_note := 'Order placed — awaiting stock confirmation (backorder mode)';
  ELSE
    v_initial_status := 'awaiting_payment'::public.order_status;
    v_event_note := 'Order placed on website';
  END IF;

  v_customer_id := public.upsert_customer(p_phone, p_customer_name, p_email);
  v_ref := public.generate_order_reference();

  INSERT INTO public.orders (
    customer_id, customer_name, phone, email, address, notes,
    total, subtotal, delivery_fee, grand_total,
    delivery_zone_id, delivery_area,
    express_delivery, cash_on_delivery, checkout_session_id,
    preferred_payment_provider,
    status, order_status, payment_status,
    order_reference, inventory_state
  )
  VALUES (
    v_customer_id, p_customer_name, p_phone, NULLIF(trim(p_email), ''), COALESCE(p_address, ''), COALESCE(p_notes, ''),
    p_grand_total, p_subtotal, p_delivery_fee, p_grand_total,
    p_delivery_zone_id, NULLIF(p_delivery_area, ''),
    p_express_delivery, p_cash_on_delivery, NULLIF(p_checkout_session_id, ''),
    p_preferred_payment_provider,
    'pending', v_initial_status, 'pending'::public.payment_status,
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

  IF NOT (v_has_shortfall AND v_mode = 'backorder') THEN
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
  END IF;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, note)
  VALUES (v_order_id, NULL, v_initial_status, v_event_note);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_reference', v_ref,
    'customer_id', v_customer_id,
    'order_status', v_initial_status::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean, text, text, public.payment_provider
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean, text, text, public.payment_provider
) TO service_role;

-- ---------------------------------------------------------------------------
-- Order confirmation: include preferred payment method
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
  v_total_paid numeric;
BEGIN
  SELECT
    id, order_reference, customer_name, phone, email,
    delivery_area, address, notes,
    subtotal, delivery_fee, grand_total,
    express_delivery, cash_on_delivery, preferred_payment_provider,
    order_status, payment_status, payment_review_required, created_at
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

  SELECT COALESCE(SUM(amount_paid), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE order_id = o.id
    AND payment_status NOT IN ('failed'::public.payment_status, 'refunded'::public.payment_status);

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
    'preferred_payment_provider', o.preferred_payment_provider,
    'order_status', o.order_status,
    'payment_status', o.payment_status,
    'payment_review_required', o.payment_review_required,
    'total_paid', v_total_paid,
    'amount_remaining', GREATEST(0, COALESCE(o.grand_total, 0) - v_total_paid),
    'created_at', o.created_at,
    'items', items
  );
END;
$$;

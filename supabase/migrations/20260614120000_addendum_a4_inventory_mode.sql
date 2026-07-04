-- Addendum A4: inventory mode (STRICT vs BACKORDER) + awaiting_stock_confirmation workflow

DO $$ BEGIN
  CREATE TYPE public.inventory_mode AS ENUM ('strict', 'backorder');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.order_status ADD VALUE 'awaiting_stock_confirmation';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS inventory_mode public.inventory_mode NOT NULL DEFAULT 'strict';

UPDATE public.settings SET inventory_mode = 'strict' WHERE inventory_mode IS NULL;

CREATE OR REPLACE FUNCTION public.get_store_inventory_mode()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT inventory_mode::text FROM public.settings WHERE id = 1 LIMIT 1),
    'strict'
  );
$$;

REVOKE ALL ON FUNCTION public.get_store_inventory_mode() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_inventory_mode() TO anon, authenticated, service_role;

-- Keep internal reserve helper in sync with recycle-bin rules
CREATE OR REPLACE FUNCTION public._reserve_product_stock(
  p_product_id uuid,
  p_qty int,
  p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available int;
  v_name text;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT available_stock, name
  INTO v_available, v_name
  FROM public.products
  WHERE id = p_product_id
    AND is_active = true
    AND archived_at IS NULL
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is no longer available';
  END IF;

  IF v_available < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock for "%" (requested %, available %)', v_name, p_qty, v_available
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.products
  SET
    available_stock = available_stock - p_qty,
    reserved_stock  = reserved_stock + p_qty,
    updated_at      = now()
  WHERE id = p_product_id;

  INSERT INTO public.inventory_events (product_id, order_id, delta_available, delta_reserved, reason)
  VALUES (p_product_id, p_order_id, -p_qty, p_qty, 'order_reserved');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_order_transition(
  p_from public.order_status,
  p_to public.order_status
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_from IS NULL OR p_from = p_to THEN true
    WHEN p_from = 'awaiting_stock_confirmation' AND p_to IN ('cancelled') THEN true
    WHEN p_from = 'awaiting_payment' AND p_to IN ('confirmed', 'cancelled') THEN true
    WHEN p_from = 'confirmed' AND p_to IN ('packed', 'cancelled') THEN true
    WHEN p_from = 'packed' AND p_to IN ('shipped', 'cancelled') THEN true
    WHEN p_from = 'shipped' AND p_to IN ('delivered', 'cancelled') THEN true
    WHEN p_from IN ('delivered', 'cancelled') THEN false
    ELSE false
  END;
$$;

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
  v_mode text;
  v_has_shortfall boolean := false;
  v_available int;
  v_initial_status public.order_status;
  v_event_note text;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
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
    status, order_status, payment_status,
    order_reference, inventory_state
  )
  VALUES (
    v_customer_id, p_customer_name, p_phone, NULLIF(trim(p_email), ''), COALESCE(p_address, ''), COALESCE(p_notes, ''),
    p_grand_total, p_subtotal, p_delivery_fee, p_grand_total,
    p_delivery_zone_id, NULLIF(p_delivery_area, ''),
    p_express_delivery, p_cash_on_delivery, NULLIF(p_checkout_session_id, ''),
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

CREATE OR REPLACE FUNCTION public.confirm_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old public.order_status;
  agg record;
BEGIN
  SELECT order_status INTO v_old
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_old <> 'awaiting_stock_confirmation'::public.order_status THEN
    RAISE EXCEPTION 'Order is not awaiting stock confirmation';
  END IF;

  FOR agg IN
    SELECT oi.product_id, SUM(oi.quantity)::int AS qty
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
  LOOP
    PERFORM public._reserve_product_stock(agg.product_id, agg.qty, p_order_id);
  END LOOP;

  UPDATE public.orders
  SET
    order_status = 'awaiting_payment'::public.order_status,
    inventory_state = 'reserved',
    status = 'pending',
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, note)
  VALUES (
    p_order_id,
    v_old,
    'awaiting_payment'::public.order_status,
    'Stock confirmed — awaiting payment'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_order_payment(
  p_order_id uuid,
  p_payment_provider public.payment_provider,
  p_payer_phone text,
  p_amount_paid numeric,
  p_transaction_reference text DEFAULT '',
  p_notes text DEFAULT '',
  p_recorded_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_payment_id uuid;
  v_total_paid numeric;
  v_new_payment_status public.payment_status;
  v_new_order_status public.order_status;
  v_old_order_status public.order_status;
  v_review_required boolean := false;
  v_note text;
BEGIN
  IF p_amount_paid IS NULL OR p_amount_paid <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_payer_phone IS NULL OR length(trim(p_payer_phone)) < 9 THEN
    RAISE EXCEPTION 'Payer phone is required';
  END IF;

  SELECT
    id, order_reference, order_status, payment_status, grand_total, total
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.order_status = 'cancelled'::public.order_status THEN
    RAISE EXCEPTION 'Cannot record payment on a cancelled order';
  END IF;

  IF v_order.order_status = 'awaiting_stock_confirmation'::public.order_status THEN
    RAISE EXCEPTION 'Confirm stock availability before recording payment';
  END IF;

  v_old_order_status := v_order.order_status;

  INSERT INTO public.payments (
    order_id, payment_provider, transaction_reference,
    payer_phone_number, amount_paid, payment_status,
    recorded_by, notes
  )
  VALUES (
    p_order_id, p_payment_provider, NULLIF(trim(p_transaction_reference), ''),
    trim(p_payer_phone), p_amount_paid, 'paid'::public.payment_status,
    p_recorded_by, NULLIF(trim(p_notes), '')
  )
  RETURNING id INTO v_payment_id;

  SELECT COALESCE(SUM(amount_paid), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE order_id = p_order_id
    AND payment_status NOT IN ('failed'::public.payment_status, 'refunded'::public.payment_status);

  IF v_total_paid < COALESCE(v_order.grand_total, v_order.total, 0) THEN
    v_new_payment_status := 'partially_paid'::public.payment_status;
    v_new_order_status := v_old_order_status;
  ELSIF v_total_paid = COALESCE(v_order.grand_total, v_order.total, 0) THEN
    v_new_payment_status := 'paid'::public.payment_status;
    v_review_required := false;
    v_new_order_status := v_old_order_status;
    IF v_old_order_status = 'awaiting_payment'::public.order_status THEN
      v_new_order_status := 'confirmed'::public.order_status;
    END IF;
  ELSE
    v_new_payment_status := 'paid'::public.payment_status;
    v_review_required := true;
    v_new_order_status := v_old_order_status;
    IF v_old_order_status = 'awaiting_payment'::public.order_status THEN
      v_new_order_status := 'confirmed'::public.order_status;
    END IF;
  END IF;

  UPDATE public.orders
  SET
    payment_status = v_new_payment_status,
    payment_review_required = v_review_required,
    order_status = v_new_order_status,
    status = CASE v_new_order_status
      WHEN 'awaiting_payment' THEN 'pending'
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'delivered' THEN 'delivered'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_order_id;

  v_note := format(
    'Payment recorded: UGX %s via %s (payer %s%s). Total paid: UGX %s / UGX %s',
    p_amount_paid,
    p_payment_provider,
    trim(p_payer_phone),
    CASE WHEN NULLIF(trim(p_transaction_reference), '') IS NOT NULL
      THEN format(', ref %s', trim(p_transaction_reference))
      ELSE ''
    END,
    v_total_paid,
    COALESCE(v_order.grand_total, v_order.total, 0)
  );

  IF v_review_required THEN
    v_note := v_note || ' — OVERPAYMENT: review required';
  ELSIF v_new_payment_status = 'partially_paid'::public.payment_status THEN
    v_note := v_note || ' — partial payment';
  END IF;

  IF NULLIF(trim(p_notes), '') IS NOT NULL THEN
    v_note := v_note || ' — ' || trim(p_notes);
  END IF;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, note)
  VALUES (p_order_id, v_old_order_status, v_new_order_status, v_note);

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'total_paid', v_total_paid,
    'amount_due', COALESCE(v_order.grand_total, v_order.total, 0),
    'payment_status', v_new_payment_status,
    'order_status', v_new_order_status,
    'payment_review_required', v_review_required
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_order_stock(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_order_stock(uuid) TO service_role;

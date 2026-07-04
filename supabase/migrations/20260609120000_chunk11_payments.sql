-- Chunk 11: Payments Phase 1 — manual reconciliation

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_review_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_callback_reference text,
  ADD COLUMN IF NOT EXISTS provider_metadata jsonb;

-- ---------------------------------------------------------------------------
-- Record a manual payment and reconcile order totals
-- ---------------------------------------------------------------------------

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
  v_total_paid numeric;
  v_new_payment_status public.payment_status;
  v_review_required boolean := false;
  v_old_order_status public.order_status;
  v_new_order_status public.order_status;
  v_payment_id uuid;
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

-- ---------------------------------------------------------------------------
-- Confirmation lookup: include payment reconciliation snapshot
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
    express_delivery, cash_on_delivery,
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

REVOKE ALL ON FUNCTION public.record_order_payment(
  uuid, public.payment_provider, text, numeric, text, text, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_order_payment(
  uuid, public.payment_provider, text, numeric, text, text, uuid
) TO service_role;

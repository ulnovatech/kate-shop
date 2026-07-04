-- Chunk 12: Order operations — validated status transitions

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
    WHEN p_from = 'awaiting_payment' AND p_to IN ('confirmed', 'cancelled') THEN true
    WHEN p_from = 'confirmed' AND p_to IN ('packed', 'cancelled') THEN true
    WHEN p_from = 'packed' AND p_to IN ('shipped', 'cancelled') THEN true
    WHEN p_from = 'shipped' AND p_to IN ('delivered', 'cancelled') THEN true
    WHEN p_from IN ('delivered', 'cancelled') THEN false
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.update_order_status_with_inventory(
  p_order_id uuid,
  p_new_status public.order_status,
  p_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old public.order_status;
BEGIN
  SELECT order_status INTO v_old
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_old = p_new_status THEN
    RETURN;
  END IF;

  IF NOT public.is_valid_order_transition(v_old, p_new_status) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_old, p_new_status;
  END IF;

  IF p_new_status = 'cancelled'::public.order_status THEN
    PERFORM public.release_order_inventory(p_order_id);
  ELSIF p_new_status = 'delivered'::public.order_status THEN
    PERFORM public.fulfill_order_inventory(p_order_id);
  END IF;

  UPDATE public.orders
  SET
    order_status = p_new_status,
    status = CASE p_new_status
      WHEN 'awaiting_payment' THEN 'pending'
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'delivered' THEN 'delivered'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_events (order_id, from_status, to_status, note)
  VALUES (p_order_id, v_old, p_new_status, NULLIF(p_note, ''));
END;
$$;

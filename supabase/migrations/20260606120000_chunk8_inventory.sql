-- Chunk 8: Inventory reservation, release, and fulfillment

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS inventory_state text NOT NULL DEFAULT 'none';

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_inventory_state_check
    CHECK (inventory_state IN ('none', 'reserved', 'released', 'fulfilled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Reserve stock for one product line (row lock)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Release reservation (cancel / payment failed)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.release_order_inventory(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id = p_order_id AND inventory_state = 'reserved'
  ) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    UPDATE public.products
    SET
      available_stock = available_stock + r.quantity,
      reserved_stock  = GREATEST(0, reserved_stock - r.quantity),
      updated_at      = now()
    WHERE id = r.product_id;

    INSERT INTO public.inventory_events (product_id, order_id, delta_available, delta_reserved, reason)
    VALUES (r.product_id, p_order_id, r.quantity, -r.quantity, 'order_released');
  END LOOP;

  UPDATE public.orders
  SET inventory_state = 'released', updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Fulfill reservation (delivered — consume stock)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fulfill_order_inventory(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id = p_order_id AND inventory_state = 'reserved'
  ) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    UPDATE public.products
    SET
      reserved_stock  = GREATEST(0, reserved_stock - r.quantity),
      stock_quantity  = GREATEST(0, stock_quantity - r.quantity),
      updated_at      = now()
    WHERE id = r.product_id;

    INSERT INTO public.inventory_events (product_id, order_id, delta_available, delta_reserved, reason)
    VALUES (r.product_id, p_order_id, 0, -r.quantity, 'order_fulfilled');
  END LOOP;

  UPDATE public.orders
  SET inventory_state = 'fulfilled', updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic checkout: order + line items + reservation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order_with_reservation(
  p_customer_name text,
  p_phone text,
  p_address text DEFAULT '',
  p_notes text DEFAULT '',
  p_subtotal numeric DEFAULT 0,
  p_delivery_fee numeric DEFAULT 0,
  p_grand_total numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_ref text;
  item jsonb;
  agg record;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  v_ref := public.generate_order_reference();

  INSERT INTO public.orders (
    customer_name, phone, address, notes,
    total, subtotal, delivery_fee, grand_total,
    status, order_status, payment_status,
    order_reference, inventory_state
  )
  VALUES (
    p_customer_name, p_phone, COALESCE(p_address, ''), COALESCE(p_notes, ''),
    p_grand_total, p_subtotal, p_delivery_fee, p_grand_total,
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
    'order_reference', v_ref
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin status change with inventory side-effects
-- ---------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION public._reserve_product_stock(uuid, int, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_order_inventory(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fulfill_order_inventory(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_with_reservation(text, text, text, text, numeric, numeric, numeric, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_order_status_with_inventory(uuid, public.order_status, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_order_with_reservation(text, text, text, text, numeric, numeric, numeric, jsonb)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.release_order_inventory(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_order_inventory(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_order_status_with_inventory(uuid, public.order_status, text)
  TO service_role;

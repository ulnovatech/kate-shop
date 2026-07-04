-- Chunk 9: Delivery order fields + area visibility + extended checkout RPC

DROP POLICY IF EXISTS "public read delivery areas" ON public.delivery_zone_areas;
CREATE POLICY "public read delivery areas" ON public.delivery_zone_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_zones z
      WHERE z.id = zone_id AND z.is_active = true
    )
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
  p_cash_on_delivery boolean DEFAULT false
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
    delivery_zone_id, delivery_area,
    express_delivery, cash_on_delivery,
    status, order_status, payment_status,
    order_reference, inventory_state
  )
  VALUES (
    p_customer_name, p_phone, COALESCE(p_address, ''), COALESCE(p_notes, ''),
    p_grand_total, p_subtotal, p_delivery_fee, p_grand_total,
    p_delivery_zone_id, NULLIF(p_delivery_area, ''),
    p_express_delivery, p_cash_on_delivery,
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

REVOKE ALL ON FUNCTION public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_order_with_reservation(
  text, text, text, text, numeric, numeric, numeric, jsonb, uuid, text, boolean, boolean
) TO service_role;

-- Addendum A3: unified recycle bin (soft delete + restore + purge)

DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'item_restored'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'item_purged'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Legacy soft-delete rows (is_active=false) → recycle bin
UPDATE public.products
SET deleted_at = COALESCE(updated_at, now()),
    deleted_by = NULL
WHERE is_active = false
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS products_deleted_at_idx
  ON public.products (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS categories_deleted_at_idx
  ON public.categories (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Storefront: hide recycled catalog entities
DROP POLICY IF EXISTS "public read visible products" ON public.products;
CREATE POLICY "public read visible products" ON public.products
  FOR SELECT USING (
    is_visible = true
    AND is_active = true
    AND archived_at IS NULL
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "public read categories" ON public.categories;
CREATE POLICY "public read categories" ON public.categories
  FOR SELECT USING (is_hidden = false AND deleted_at IS NULL);

-- Inventory: block reservations on recycled products
CREATE OR REPLACE FUNCTION public.reserve_product_stock(
  p_product_id uuid,
  p_order_id uuid,
  p_qty int
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

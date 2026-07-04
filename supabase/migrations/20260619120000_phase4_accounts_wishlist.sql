-- Phase 4: Customer accounts + wishlist

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_auth_user_id_idx ON public.customers (auth_user_id);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_items_unique UNIQUE (auth_user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_items_user_idx ON public.wishlist_items (auth_user_id);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer read own wishlist" ON public.wishlist_items;
CREATE POLICY "customer read own wishlist" ON public.wishlist_items
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "customer insert own wishlist" ON public.wishlist_items;
CREATE POLICY "customer insert own wishlist" ON public.wishlist_items
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "customer delete own wishlist" ON public.wishlist_items;
CREATE POLICY "customer delete own wishlist" ON public.wishlist_items
  FOR DELETE TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "customer read own profile" ON public.customers;
CREATE POLICY "customer read own profile" ON public.customers
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "customer update own profile" ON public.customers;
CREATE POLICY "customer update own profile" ON public.customers
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

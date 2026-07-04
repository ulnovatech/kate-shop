-- C13: Per-staff order view tracking for unopened-order nav badges

CREATE TABLE IF NOT EXISTS public.staff_order_views (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, order_id)
);

CREATE INDEX IF NOT EXISTS staff_order_views_user_idx
  ON public.staff_order_views (user_id);

ALTER TABLE public.staff_order_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage own order views" ON public.staff_order_views;

CREATE POLICY "staff manage own order views" ON public.staff_order_views
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_order_views TO authenticated;
GRANT ALL ON public.staff_order_views TO service_role;

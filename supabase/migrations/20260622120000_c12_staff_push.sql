-- C12: Staff push subscriptions (FCM / future web push) — silent until FCM_SERVER_KEY is set

CREATE TABLE IF NOT EXISTS public.staff_push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     text NOT NULL CHECK (platform IN ('fcm', 'web')),
  token        text NOT NULL,
  device_label text,
  enabled      boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS staff_push_subscriptions_user_idx
  ON public.staff_push_subscriptions (user_id)
  WHERE enabled = true;

ALTER TABLE public.staff_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage own push subscriptions" ON public.staff_push_subscriptions;

CREATE POLICY "staff manage own push subscriptions" ON public.staff_push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_push_subscriptions TO authenticated;
GRANT ALL ON public.staff_push_subscriptions TO service_role;

CREATE TABLE IF NOT EXISTS public.staff_push_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    text NOT NULL,
  order_id      uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  title         text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_push_log_created_idx
  ON public.staff_push_log (created_at DESC);

ALTER TABLE public.staff_push_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read push log" ON public.staff_push_log;

CREATE POLICY "staff read push log" ON public.staff_push_log
  FOR SELECT TO authenticated
  USING (public.can_manage_orders(auth.uid()));

GRANT SELECT ON public.staff_push_log TO authenticated;
GRANT ALL ON public.staff_push_log TO service_role;

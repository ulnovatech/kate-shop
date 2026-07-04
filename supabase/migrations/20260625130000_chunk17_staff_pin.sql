-- C15: Staff PIN credentials for optional PIN login

CREATE TABLE IF NOT EXISTS public.staff_pin_credentials (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash        text NOT NULL,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_pin_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read own pin row" ON public.staff_pin_credentials;

CREATE POLICY "staff read own pin row" ON public.staff_pin_credentials
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.staff_pin_credentials TO authenticated;
GRANT ALL ON public.staff_pin_credentials TO service_role;

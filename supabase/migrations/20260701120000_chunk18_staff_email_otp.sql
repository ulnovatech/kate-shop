-- Chunk 18 (auth) — Staff email OTP for signup, forgot PIN, and invite accept

CREATE TABLE IF NOT EXISTS public.staff_email_verifications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   text NOT NULL,
  code_hash               text NOT NULL,
  purpose                 text NOT NULL CHECK (purpose IN ('signup', 'forgot_pin', 'invite_accept')),
  expires_at              timestamptz NOT NULL,
  attempts                int NOT NULL DEFAULT 0,
  consumed_at             timestamptz,
  verification_token_hash text,
  verification_expires_at timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_email_verifications_email_purpose_idx
  ON public.staff_email_verifications (lower(email), purpose, created_at DESC);

ALTER TABLE public.staff_email_verifications ENABLE ROW LEVEL SECURITY;

-- Service role only (accessed via server functions)
REVOKE ALL ON public.staff_email_verifications FROM anon, authenticated;

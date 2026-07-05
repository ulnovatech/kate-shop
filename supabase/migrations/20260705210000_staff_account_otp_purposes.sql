-- Extend staff email OTP purposes for My account (email + recovery password)

ALTER TABLE public.staff_email_verifications
  DROP CONSTRAINT IF EXISTS staff_email_verifications_purpose_check;

ALTER TABLE public.staff_email_verifications
  ADD CONSTRAINT staff_email_verifications_purpose_check
  CHECK (purpose IN (
    'signup',
    'forgot_pin',
    'invite_accept',
    'change_email',
    'change_password'
  ));

DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'staff_email_updated'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'staff_password_updated'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Chunk 4: Admin bootstrap + invitations

CREATE OR REPLACE FUNCTION public.is_bootstrap_required()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_bootstrap_required() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bootstrap_required() TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_invites_role_invite CHECK (role IN ('manager', 'staff', 'admin'))
);

CREATE INDEX IF NOT EXISTS admin_invites_email_idx ON public.admin_invites (lower(email));
CREATE INDEX IF NOT EXISTS admin_invites_expires_idx ON public.admin_invites (expires_at) WHERE used_at IS NULL;

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner manage invites" ON public.admin_invites;
CREATE POLICY "owner manage invites" ON public.admin_invites FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;

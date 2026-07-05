-- Staff invites: link-only (email chosen by invitee at signup)

ALTER TABLE public.admin_invites
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.admin_invites.email IS
  'Set when the invite is accepted; null while the one-time link is unused.';

-- Addendum A9: Permission matrix + custom roles

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  PRIMARY KEY (role_id, permission_key),
  CONSTRAINT role_permissions_key_format CHECK (permission_key ~ '^[a-z_]+\.(view|create|edit|delete|approve|export|manage)$')
);

CREATE TABLE IF NOT EXISTS public.staff_role_assignments (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS staff_role_assignments_role_id_idx
  ON public.staff_role_assignments (role_id);

ALTER TABLE public.admin_invites
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- Seed system roles (stable IDs)
-- ---------------------------------------------------------------------------

INSERT INTO public.roles (id, slug, name, description, is_system, is_locked)
VALUES
  ('a9000001-0001-4001-a001-000000000001', 'owner', 'Owner', 'Full access — locked system role', true, true),
  ('a9000001-0001-4001-a001-000000000002', 'admin', 'Admin', 'Legacy full access (system)', true, false),
  ('a9000001-0001-4001-a001-000000000003', 'manager', 'Manager', 'Catalog, orders, payments, custom roles', true, false),
  ('a9000001-0001-4001-a001-000000000004', 'staff', 'Staff', 'Orders and payment recording only', true, false),
  ('a9000001-0001-4001-a001-000000000005', 'delivery_rider', 'Delivery Rider', 'Assigned/shipped orders', true, false),
  ('a9000001-0001-4001-a001-000000000006', 'accountant', 'Accountant', 'Payments and order lookup', true, false),
  ('a9000001-0001-4001-a001-000000000007', 'stock_controller', 'Stock Controller', 'Inventory and product edits', true, false)
ON CONFLICT (id) DO NOTHING;

-- Helper to grant keys to a role
CREATE OR REPLACE FUNCTION public._seed_role_permissions(p_role_id uuid, p_keys text[])
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  k text;
BEGIN
  FOREACH k IN ARRAY p_keys
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_key)
    VALUES (p_role_id, k)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- All keys for owner/admin
SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000001',
  ARRAY[
    'catalog.view','catalog.create','catalog.edit','catalog.delete',
    'orders.view','orders.create','orders.edit','orders.delete','orders.approve','orders.export',
    'payments.view','payments.create','payments.approve','payments.export',
    'settings.view','settings.manage',
    'team.view','team.manage',
    'audit.view',
    'inventory.view','inventory.edit',
    'delivery.view','delivery.manage',
    'roles.view','roles.manage'
  ]
);

SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000002',
  ARRAY[
    'catalog.view','catalog.create','catalog.edit','catalog.delete',
    'orders.view','orders.create','orders.edit','orders.delete','orders.approve','orders.export',
    'payments.view','payments.create','payments.approve','payments.export',
    'settings.view','settings.manage',
    'team.view','team.manage',
    'audit.view',
    'inventory.view','inventory.edit',
    'delivery.view','delivery.manage',
    'roles.view','roles.manage'
  ]
);

SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000003',
  ARRAY[
    'catalog.view','catalog.create','catalog.edit','catalog.delete',
    'orders.view','orders.create','orders.edit','orders.delete','orders.approve','orders.export',
    'payments.view','payments.create','payments.approve','payments.export',
    'settings.view',
    'team.view',
    'audit.view',
    'inventory.view','inventory.edit',
    'delivery.view',
    'roles.view','roles.manage'
  ]
);

SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000004',
  ARRAY['catalog.view','orders.view','orders.edit','payments.view','payments.create']
);

SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000005',
  ARRAY['orders.view','orders.approve']
);

SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000006',
  ARRAY['orders.view','payments.view','payments.create','payments.approve','payments.export']
);

SELECT public._seed_role_permissions(
  'a9000001-0001-4001-a001-000000000007',
  ARRAY['catalog.view','catalog.edit','inventory.view','inventory.edit']
);

DROP FUNCTION public._seed_role_permissions(uuid, text[]);

-- Migrate existing user_roles → staff_role_assignments
INSERT INTO public.staff_role_assignments (user_id, role_id, assigned_at)
SELECT
  ur.user_id,
  CASE ur.role::text
    WHEN 'owner' THEN 'a9000001-0001-4001-a001-000000000001'::uuid
    WHEN 'admin' THEN 'a9000001-0001-4001-a001-000000000002'::uuid
    WHEN 'manager' THEN 'a9000001-0001-4001-a001-000000000003'::uuid
    ELSE 'a9000001-0001-4001-a001-000000000004'::uuid
  END,
  now()
FROM public.user_roles ur
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.admin_invites ai
SET role_id = CASE ai.role::text
  WHEN 'admin' THEN 'a9000001-0001-4001-a001-000000000002'::uuid
  WHEN 'manager' THEN 'a9000001-0001-4001-a001-000000000003'::uuid
  ELSE 'a9000001-0001-4001-a001-000000000004'::uuid
END
WHERE ai.role_id IS NULL;

-- Keep legacy user_roles in sync for RLS until A11
CREATE OR REPLACE FUNCTION public.sync_legacy_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_legacy public.app_role;
BEGIN
  SELECT slug INTO v_slug FROM public.roles WHERE id = NEW.role_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_legacy := CASE v_slug
    WHEN 'owner' THEN 'owner'::public.app_role
    WHEN 'admin' THEN 'admin'::public.app_role
    WHEN 'manager' THEN 'manager'::public.app_role
    WHEN 'stock_controller' THEN 'manager'::public.app_role
    ELSE 'staff'::public.app_role
  END;

  DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, v_legacy);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS staff_role_assignments_sync_legacy_trg ON public.staff_role_assignments;
CREATE TRIGGER staff_role_assignments_sync_legacy_trg
  AFTER INSERT OR UPDATE OF role_id ON public.staff_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_legacy_user_role();

-- Backfill legacy user_roles for migrated assignments (trigger runs on INSERT)
-- Re-touch assignments so sync trigger fires for any pre-existing rows without legacy sync
UPDATE public.staff_role_assignments SET assigned_at = assigned_at;

CREATE OR REPLACE FUNCTION public.staff_has_permission(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_role_assignments sra
    INNER JOIN public.role_permissions rp ON rp.role_id = sra.role_id
    WHERE sra.user_id = _user_id
      AND rp.permission_key = _module || '.' || _action
  );
$$;

GRANT EXECUTE ON FUNCTION public.staff_has_permission(uuid, text, text) TO authenticated, service_role;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_staff_read ON public.roles;
CREATE POLICY roles_staff_read ON public.roles
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()));

DROP POLICY IF EXISTS role_permissions_staff_read ON public.role_permissions;
CREATE POLICY role_permissions_staff_read ON public.role_permissions
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()));

DROP POLICY IF EXISTS staff_assignments_read_own ON public.staff_role_assignments;
CREATE POLICY staff_assignments_read_own ON public.staff_role_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_owner(auth.uid()));

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.staff_role_assignments TO authenticated;
GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.role_permissions TO service_role;
GRANT ALL ON public.staff_role_assignments TO service_role;

CREATE OR REPLACE FUNCTION public.is_bootstrap_required()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.staff_role_assignments sra
    INNER JOIN public.roles r ON r.id = sra.role_id
    WHERE r.slug IN ('owner', 'admin')
  );
$$;

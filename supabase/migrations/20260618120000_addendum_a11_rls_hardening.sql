-- Addendum A11: RLS alignment with permission matrix (A9)

-- ---------------------------------------------------------------------------
-- Permission helper (single-key convenience)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.staff_has_permission_key(_user_id uuid, _permission_key text)
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
      AND rp.permission_key = _permission_key
  );
$$;

GRANT EXECUTE ON FUNCTION public.staff_has_permission_key(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Legacy bridge helpers → matrix-first with user_roles fallback
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_staff_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_role_assignments WHERE user_id = _user_id
  )
  OR public.user_has_any_role(
    _user_id,
    ARRAY['owner','manager','staff','admin']::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.staff_has_permission(_user_id, 'settings', 'manage')
     OR public.has_role(_user_id, 'owner')
     OR public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_catalog(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.staff_has_permission(_user_id, 'catalog', 'view')
     OR public.staff_has_permission(_user_id, 'catalog', 'create')
     OR public.staff_has_permission(_user_id, 'catalog', 'edit')
     OR public.staff_has_permission(_user_id, 'catalog', 'delete')
     OR public.user_has_any_role(
       _user_id,
       ARRAY['owner','manager','admin']::public.app_role[]
     );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_orders(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.staff_has_permission(_user_id, 'orders', 'view')
     OR public.user_has_any_role(
       _user_id,
       ARRAY['owner','manager','staff','admin']::public.app_role[]
     );
$$;

-- ---------------------------------------------------------------------------
-- Catalog: granular policies (products, categories, images, variants)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff read all categories" ON public.categories;
DROP POLICY IF EXISTS "staff manage categories" ON public.categories;

CREATE POLICY "staff read categories" ON public.categories
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'view'));

CREATE POLICY "staff insert categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'create'));

CREATE POLICY "staff update categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'edit'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'edit'));

CREATE POLICY "staff delete categories" ON public.categories
  FOR DELETE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'delete'));

DROP POLICY IF EXISTS "staff read all products" ON public.products;
DROP POLICY IF EXISTS "staff manage products" ON public.products;

CREATE POLICY "staff read products" ON public.products
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'view'));

CREATE POLICY "staff insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'create'));

CREATE POLICY "staff update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'edit'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'edit'));

CREATE POLICY "staff delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'delete'));

DROP POLICY IF EXISTS "staff manage product images" ON public.product_images;

CREATE POLICY "staff read product images" ON public.product_images
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'view'));

CREATE POLICY "staff insert product images" ON public.product_images
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'edit'));

CREATE POLICY "staff update product images" ON public.product_images
  FOR UPDATE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'edit'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'edit'));

CREATE POLICY "staff delete product images" ON public.product_images
  FOR DELETE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'delete'));

DROP POLICY IF EXISTS "staff manage variants" ON public.product_variants;

CREATE POLICY "staff read variants" ON public.product_variants
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'view'));

CREATE POLICY "staff insert variants" ON public.product_variants
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'edit'));

CREATE POLICY "staff update variants" ON public.product_variants
  FOR UPDATE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'edit'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'catalog', 'edit'));

CREATE POLICY "staff delete variants" ON public.product_variants
  FOR DELETE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'catalog', 'delete'));

-- ---------------------------------------------------------------------------
-- Orders + order items (replace stale admin-only policies)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin read orders" ON public.orders;
DROP POLICY IF EXISTS "admin update orders" ON public.orders;
DROP POLICY IF EXISTS "admin delete orders" ON public.orders;

CREATE POLICY "staff read orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'view'));

CREATE POLICY "staff update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.staff_has_permission(auth.uid(), 'orders', 'edit')
    OR public.staff_has_permission(auth.uid(), 'orders', 'approve')
  )
  WITH CHECK (
    public.staff_has_permission(auth.uid(), 'orders', 'edit')
    OR public.staff_has_permission(auth.uid(), 'orders', 'approve')
  );

CREATE POLICY "staff delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'delete'));

DROP POLICY IF EXISTS "admin read order items" ON public.order_items;
DROP POLICY IF EXISTS "admin manage order items" ON public.order_items;

CREATE POLICY "staff read order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'view'));

CREATE POLICY "staff manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (
    public.staff_has_permission(auth.uid(), 'orders', 'edit')
    OR public.staff_has_permission(auth.uid(), 'orders', 'approve')
  )
  WITH CHECK (
    public.staff_has_permission(auth.uid(), 'orders', 'edit')
    OR public.staff_has_permission(auth.uid(), 'orders', 'approve')
  );

DROP POLICY IF EXISTS "staff read order events" ON public.order_status_events;
DROP POLICY IF EXISTS "staff insert order events" ON public.order_status_events;

CREATE POLICY "staff read order events" ON public.order_status_events
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'view'));

CREATE POLICY "staff insert order events" ON public.order_status_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.staff_has_permission(auth.uid(), 'orders', 'edit')
    OR public.staff_has_permission(auth.uid(), 'orders', 'approve')
  );

-- ---------------------------------------------------------------------------
-- Settings (owner-only per matrix seed)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin update settings" ON public.settings;
DROP POLICY IF EXISTS "admin insert settings" ON public.settings;

CREATE POLICY "staff manage settings" ON public.settings
  FOR ALL TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'settings', 'manage'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'settings', 'manage'));

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff read payments" ON public.payments;
DROP POLICY IF EXISTS "staff insert payments" ON public.payments;
DROP POLICY IF EXISTS "staff update payments" ON public.payments;

CREATE POLICY "staff read payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'payments', 'view'));

CREATE POLICY "staff insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_has_permission(auth.uid(), 'payments', 'create'));

CREATE POLICY "staff update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'payments', 'approve'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'payments', 'approve'));

-- ---------------------------------------------------------------------------
-- Customers, audit, delivery, payment methods, invites, inventory
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff read customers" ON public.customers;
CREATE POLICY "staff read customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'view'));

DROP POLICY IF EXISTS "staff read audit" ON public.audit_logs;
DROP POLICY IF EXISTS "staff insert audit" ON public.audit_logs;

CREATE POLICY "staff read audit" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'audit', 'view'));

CREATE POLICY "staff insert audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_member(auth.uid()));

DROP POLICY IF EXISTS "staff manage delivery zones" ON public.delivery_zones;
CREATE POLICY "staff manage delivery zones" ON public.delivery_zones
  FOR ALL TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'delivery', 'manage'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'delivery', 'manage'));

DROP POLICY IF EXISTS "staff manage delivery areas" ON public.delivery_zone_areas;
CREATE POLICY "staff manage delivery areas" ON public.delivery_zone_areas
  FOR ALL TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'delivery', 'manage'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'delivery', 'manage'));

DROP POLICY IF EXISTS "owner manage delivery rules" ON public.delivery_rules;
CREATE POLICY "staff manage delivery rules" ON public.delivery_rules
  FOR ALL TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'delivery', 'manage'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'delivery', 'manage'));

DROP POLICY IF EXISTS payment_methods_staff_all ON public.payment_methods;
CREATE POLICY payment_methods_staff_all ON public.payment_methods
  FOR ALL TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'settings', 'manage'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'settings', 'manage'));

DROP POLICY IF EXISTS "owner manage invites" ON public.admin_invites;
CREATE POLICY "team manage invites" ON public.admin_invites
  FOR ALL TO authenticated
  USING (
    public.staff_has_permission(auth.uid(), 'team', 'manage')
    OR public.staff_has_permission(auth.uid(), 'settings', 'manage')
  )
  WITH CHECK (
    public.staff_has_permission(auth.uid(), 'team', 'manage')
    OR public.staff_has_permission(auth.uid(), 'settings', 'manage')
  );

DROP POLICY IF EXISTS "staff read inventory events" ON public.inventory_events;
CREATE POLICY "staff read inventory events" ON public.inventory_events
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'inventory', 'view'));

DROP POLICY IF EXISTS "staff read notifications" ON public.notification_outbox;
DROP POLICY IF EXISTS "staff update notifications" ON public.notification_outbox;

CREATE POLICY "staff read notifications" ON public.notification_outbox
  FOR SELECT TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'view'));

CREATE POLICY "staff update notifications" ON public.notification_outbox
  FOR UPDATE TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'orders', 'edit'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'orders', 'edit'));

-- ---------------------------------------------------------------------------
-- Storage: product-images bucket
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "admin update product-images" ON storage.objects;
DROP POLICY IF EXISTS "admin delete product-images" ON storage.objects;

CREATE POLICY "staff upload product-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      public.staff_has_permission(auth.uid(), 'catalog', 'create')
      OR public.staff_has_permission(auth.uid(), 'catalog', 'edit')
    )
  );

CREATE POLICY "staff update product-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.staff_has_permission(auth.uid(), 'catalog', 'edit')
  );

CREATE POLICY "staff delete product-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.staff_has_permission(auth.uid(), 'catalog', 'delete')
  );

-- Chunk 3: Production schema expansion (Kate shop)
-- Idempotent where practical; designed to be safe to re-run.

-- ===========================================================================
-- Enums
-- ===========================================================================

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'awaiting_payment', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending', 'partially_paid', 'paid', 'failed', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM (
    'mtn_momo', 'airtel_money', 'cash_on_delivery', 'bank_transfer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM (
    'product_created', 'product_updated', 'product_deleted',
    'order_updated', 'settings_changed', 'user_login', 'payment_recorded', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend existing app_role enum (keep legacy admin)
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE 'owner';   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE 'manager'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE 'staff';   EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===========================================================================
-- Role helper functions
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY (_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.user_has_any_role(
    _user_id,
    ARRAY['owner','manager','staff','admin']::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_catalog(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.user_has_any_role(
    _user_id,
    ARRAY['owner','manager','admin']::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_orders(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.user_has_any_role(
    _user_id,
    ARRAY['owner','manager','staff','admin']::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'owner')
     OR public.has_role(_user_id, 'admin');
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.user_has_any_role(uuid, public.app_role[]) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.is_staff_member(uuid)  TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.can_manage_catalog(uuid) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.can_manage_orders(uuid)  TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.is_owner(uuid)           TO authenticated, service_role;

-- ===========================================================================
-- Order reference sequence (KS-YYYY-NNNNNN)
-- ===========================================================================

CREATE SEQUENCE IF NOT EXISTS public.order_reference_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_reference()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  yr text := to_char(now(), 'YYYY');
  n  bigint;
BEGIN
  n := nextval('public.order_reference_seq');
  RETURN 'KS-' || yr || '-' || lpad(n::text, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_order_reference() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.generate_order_reference() TO anon, authenticated, service_role;

-- ===========================================================================
-- Customers
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  name        text NOT NULL DEFAULT '',
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_phone_unique UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS customers_phone_idx ON public.customers (phone);

GRANT SELECT ON public.customers TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON public.customers TO authenticated, service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert customers" ON public.customers;
CREATE POLICY "anon insert customers" ON public.customers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "staff read customers" ON public.customers;
CREATE POLICY "staff read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.can_manage_orders(auth.uid()));

-- ===========================================================================
-- Categories: SEO + visibility
-- ===========================================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS meta_title        text,
  ADD COLUMN IF NOT EXISTS meta_description  text,
  ADD COLUMN IF NOT EXISTS is_hidden         boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "public read categories" ON public.categories;
DROP POLICY IF EXISTS "admin manage categories" ON public.categories;

CREATE POLICY "public read categories" ON public.categories
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "staff read all categories" ON public.categories
  FOR SELECT TO authenticated
  USING (public.can_manage_catalog(auth.uid()));

CREATE POLICY "staff manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid()))
  WITH CHECK (public.can_manage_catalog(auth.uid()));

-- ===========================================================================
-- Products: inventory + SEO + archive
-- ===========================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS available_stock     int,
  ADD COLUMN IF NOT EXISTS reserved_stock      int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold int NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS meta_title          text,
  ADD COLUMN IF NOT EXISTS meta_description    text,
  ADD COLUMN IF NOT EXISTS archived_at         timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

-- initialize available_stock from stock_quantity if null
UPDATE public.products
SET available_stock = stock_quantity
WHERE available_stock IS NULL;

ALTER TABLE public.products
  ALTER COLUMN available_stock SET DEFAULT 0,
  ALTER COLUMN available_stock SET NOT NULL;

DROP POLICY IF EXISTS "public read visible products" ON public.products;
DROP POLICY IF EXISTS "admin read all products"      ON public.products;
DROP POLICY IF EXISTS "admin manage products"        ON public.products;

CREATE POLICY "public read visible products" ON public.products
  FOR SELECT USING (is_visible = true AND is_active = true AND archived_at IS NULL);

CREATE POLICY "staff read all products" ON public.products
  FOR SELECT TO authenticated
  USING (public.can_manage_catalog(auth.uid()));

CREATE POLICY "staff manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid()))
  WITH CHECK (public.can_manage_catalog(auth.uid()));

-- ===========================================================================
-- Product images: SEO + variants urls
-- ===========================================================================

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS alt_text      text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_primary    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS medium_url    text,
  ADD COLUMN IF NOT EXISTS full_url      text;

DROP POLICY IF EXISTS "admin manage product images" ON public.product_images;
CREATE POLICY "staff manage product images" ON public.product_images
  FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid()))
  WITH CHECK (public.can_manage_catalog(auth.uid()));

-- ===========================================================================
-- Product variants (schema only; UI in later chunk)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name           text NOT NULL,
  sku            text DEFAULT '',
  price          numeric(12,2),
  available_stock int NOT NULL DEFAULT 0,
  reserved_stock  int NOT NULL DEFAULT 0,
  attributes     jsonb NOT NULL DEFAULT '{}',
  sort_order     int NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON public.product_variants (product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read variants"   ON public.product_variants;
DROP POLICY IF EXISTS "staff manage variants" ON public.product_variants;

CREATE POLICY "public read variants" ON public.product_variants
  FOR SELECT USING (is_active = true);

CREATE POLICY "staff manage variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid()))
  WITH CHECK (public.can_manage_catalog(auth.uid()));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- ===========================================================================
-- Delivery zones / areas / rules
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_number           int NOT NULL UNIQUE,
  name                  text NOT NULL,
  fee                   numeric(12,2) NOT NULL DEFAULT 0,
  description           text DEFAULT '',
  estimated_days        text DEFAULT '',
  free_delivery_threshold numeric(12,2),
  is_active             boolean NOT NULL DEFAULT true,
  sort_order            int NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_zone_areas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id    uuid NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  area_name  text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (zone_id, area_name)
);

CREATE TABLE IF NOT EXISTS public.delivery_rules (
  id                                   int PRIMARY KEY DEFAULT 1,
  express_delivery_fee                 numeric(12,2) NOT NULL DEFAULT 5000,
  cod_fee                              numeric(12,2) NOT NULL DEFAULT 2000,
  free_delivery_zones_1_2_threshold    numeric(12,2) NOT NULL DEFAULT 200000,
  free_delivery_all_zones_threshold    numeric(12,2) NOT NULL DEFAULT 350000,
  currency                             text NOT NULL DEFAULT 'UGX',
  CONSTRAINT delivery_rules_singleton CHECK (id = 1)
);

INSERT INTO public.delivery_rules (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.delivery_zones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zone_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rules      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read delivery zones"   ON public.delivery_zones;
DROP POLICY IF EXISTS "staff manage delivery zones" ON public.delivery_zones;
CREATE POLICY "public read delivery zones" ON public.delivery_zones
  FOR SELECT USING (is_active = true);
CREATE POLICY "staff manage delivery zones" ON public.delivery_zones
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "public read delivery areas"   ON public.delivery_zone_areas;
DROP POLICY IF EXISTS "staff manage delivery areas" ON public.delivery_zone_areas;
CREATE POLICY "public read delivery areas" ON public.delivery_zone_areas
  FOR SELECT USING (true);
CREATE POLICY "staff manage delivery areas" ON public.delivery_zone_areas
  FOR ALL TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "public read delivery rules"   ON public.delivery_rules;
DROP POLICY IF EXISTS "owner manage delivery rules" ON public.delivery_rules;
CREATE POLICY "public read delivery rules" ON public.delivery_rules
  FOR SELECT USING (true);
CREATE POLICY "owner manage delivery rules" ON public.delivery_rules
  FOR UPDATE TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

GRANT SELECT ON public.delivery_zones, public.delivery_zone_areas, public.delivery_rules TO anon, authenticated;
GRANT ALL    ON public.delivery_zones, public.delivery_zone_areas, public.delivery_rules TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.delivery_zones, public.delivery_zone_areas, public.delivery_rules TO authenticated;

-- Seed Kampala zones 1–4 (idempotent)

INSERT INTO public.delivery_zones (zone_number, name, fee, description, sort_order, free_delivery_threshold)
VALUES
  (1, 'Zone 1 — Central Kampala',  5000,  'CBD and central areas',        1, NULL),
  (2, 'Zone 2 — Inner suburbs',    8000,  'Ntinda, Bukoto, Makindye, …',  2, NULL),
  (3, 'Zone 3 — Outer suburbs',   10000,  'Kira, Najjera, Bweyogerere…',  3, NULL),
  (4, 'Zone 4 — Greater metro',   15000,  'Entebbe, Mukono, Wakiso…',     4, NULL)
ON CONFLICT (zone_number) DO NOTHING;

-- Zone 1 areas
INSERT INTO public.delivery_zone_areas (zone_id, area_name, sort_order)
SELECT z.id, a.area_name, a.sort_order
FROM public.delivery_zones z
JOIN (VALUES
  ('Kampala CBD',1),('Nakasero',2),('Kololo',3),('Bugolobi',4),
  ('Wandegeya',5),('Makerere',6),('Kamwokya',7),('Old Kampala',8),
  ('Nakulabye',9),('Industrial Area',10),('Mulago',11),('Kibuli',12)
) AS a(area_name, sort_order) ON z.zone_number = 1
ON CONFLICT (zone_id, area_name) DO NOTHING;

-- Zone 2 areas
INSERT INTO public.delivery_zone_areas (zone_id, area_name, sort_order)
SELECT z.id, a.area_name, a.sort_order
FROM public.delivery_zones z
JOIN (VALUES
  ('Ntinda',1),('Bukoto',2),('Kisaasi',3),('Naguru',4),('Lugogo',5),
  ('Muyenga',6),('Makindye',7),('Mutungo',8),('Luzira',9),('Kyebando',10),
  ('Kawempe',11),('Namuwongo',12),('Buziga',13),('Ggaba',14),
  ('Munyonyo',15),('Kyanja',16),('Kulambiro',17),('Kiwatule',18)
) AS a(area_name, sort_order) ON z.zone_number = 2
ON CONFLICT (zone_id, area_name) DO NOTHING;

-- Zone 3 areas
INSERT INTO public.delivery_zone_areas (zone_id, area_name, sort_order)
SELECT z.id, a.area_name, a.sort_order
FROM public.delivery_zones z
JOIN (VALUES
  ('Naalya',1),('Najjera',2),('Kira',3),('Namugongo',4),('Kyaliwajjala',5),
  ('Bweyogerere',6),('Kireka',7),('Seeta',8),('Kasangati',9),('Sonde',10),
  ('Bulindo',11),('Nansana',12),('Kyengera',13),('Seguku',14),('Lweza',15),
  ('Lubowa',16),('Kitende',17),('Kajjansi',18),('Busabala',19)
) AS a(area_name, sort_order) ON z.zone_number = 3
ON CONFLICT (zone_id, area_name) DO NOTHING;

-- Zone 4 areas
INSERT INTO public.delivery_zone_areas (zone_id, area_name, sort_order)
SELECT z.id, a.area_name, a.sort_order
FROM public.delivery_zones z
JOIN (VALUES
  ('Entebbe',1),('Katabi',2),('Kisubi',3),('Mukono',4),('Mpigi',5),
  ('Wakiso',6),('Kakiri',7),('Matugga',8),('Garuga',9),
  ('Nakawuka',10),('Other (beyond Kampala metro)',11)
) AS a(area_name, sort_order) ON z.zone_number = 4
ON CONFLICT (zone_id, area_name) DO NOTHING;

-- ===========================================================================
-- Settings expansion (Kate shop defaults, payments, SEO)
-- ===========================================================================

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS logo_url                 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_text               text DEFAULT '',
  ADD COLUMN IF NOT EXISTS currency                 text NOT NULL DEFAULT 'UGX',
  ADD COLUMN IF NOT EXISTS meta_title               text DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description         text DEFAULT '',
  ADD COLUMN IF NOT EXISTS mtn_momo_merchant_code   text DEFAULT '',
  ADD COLUMN IF NOT EXISTS mtn_momo_merchant_name   text DEFAULT '',
  ADD COLUMN IF NOT EXISTS airtel_merchant_code     text DEFAULT '',
  ADD COLUMN IF NOT EXISTS airtel_merchant_name     text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_transfer_instructions text DEFAULT '';

UPDATE public.settings
SET
  shop_name     = 'Kate shop',
  phone         = COALESCE(NULLIF(phone, ''),    '0770486217'),
  whatsapp      = COALESCE(NULLIF(whatsapp, ''), '256770486217'),
  email         = COALESCE(NULLIF(email, ''),    'hello@kateshop.co'),
  address       = COALESCE(NULLIF(address, ''),  'Kololo, Kampala, Uganda'),
  hero_title    = COALESCE(NULLIF(hero_title, ''), 'Timeless jewelry, crafted in Kampala'),
  hero_subtitle = COALESCE(
    NULLIF(hero_subtitle, ''),
    'Discover handpicked earrings, necklaces, watches, bangles and rings — delivered across Kampala, Uganda.'
  ),
  currency      = 'UGX'
WHERE id = 1;

-- ===========================================================================
-- Orders + payments + timeline
-- ===========================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_reference   text,
  ADD COLUMN IF NOT EXISTS customer_id       uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email             text,
  ADD COLUMN IF NOT EXISTS subtotal          numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee      numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total       numeric(12,2),
  ADD COLUMN IF NOT EXISTS delivery_zone_id  uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_area     text,
  ADD COLUMN IF NOT EXISTS express_delivery  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cash_on_delivery  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes       text DEFAULT '',
  ADD COLUMN IF NOT EXISTS order_status      public.order_status,
  ADD COLUMN IF NOT EXISTS payment_status    public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz NOT NULL DEFAULT now();

UPDATE public.orders SET grand_total = total WHERE grand_total IS NULL;
UPDATE public.orders SET subtotal    = total WHERE subtotal = 0 AND total > 0;

UPDATE public.orders
SET order_status = 'awaiting_payment'::public.order_status
WHERE order_status IS NULL AND (status IS NULL OR status IN ('pending', 'awaiting_payment'));

UPDATE public.orders
SET order_status = 'confirmed'::public.order_status
WHERE order_status IS NULL AND status = 'confirmed';

UPDATE public.orders
SET order_status = 'delivered'::public.order_status
WHERE order_status IS NULL AND status = 'delivered';

UPDATE public.orders
SET order_status = 'cancelled'::public.order_status
WHERE order_status IS NULL AND status = 'cancelled';

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_reference_unique
  ON public.orders (order_reference)
  WHERE order_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_provider     public.payment_provider NOT NULL,
  transaction_reference text,
  payer_phone_number   text NOT NULL,
  amount_paid          numeric(12,2) NOT NULL,
  currency             text NOT NULL DEFAULT 'UGX',
  payment_status       public.payment_status NOT NULL DEFAULT 'paid',
  recorded_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at          timestamptz NOT NULL DEFAULT now(),
  notes                text DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx
  ON public.payments (order_id);

CREATE INDEX IF NOT EXISTS payments_payer_phone_idx
  ON public.payments (payer_phone_number);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read payments"   ON public.payments;
DROP POLICY IF EXISTS "staff insert payments" ON public.payments;
DROP POLICY IF EXISTS "staff update payments" ON public.payments;

CREATE POLICY "staff read payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.can_manage_orders(auth.uid()));

CREATE POLICY "staff insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_orders(auth.uid()));

CREATE POLICY "staff update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.can_manage_orders(auth.uid()))
  WITH CHECK (public.can_manage_orders(auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL                    ON public.payments TO service_role;

CREATE TABLE IF NOT EXISTS public.order_status_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status,
  to_status   public.order_status NOT NULL,
  note        text DEFAULT '',
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_events_order_id_idx
  ON public.order_status_events (order_id);

ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read order events"   ON public.order_status_events;
DROP POLICY IF EXISTS "staff insert order events" ON public.order_status_events;

CREATE POLICY "staff read order events" ON public.order_status_events
  FOR SELECT TO authenticated
  USING (public.can_manage_orders(auth.uid()));

CREATE POLICY "staff insert order events" ON public.order_status_events
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_orders(auth.uid()));

GRANT SELECT, INSERT ON public.order_status_events TO authenticated;
GRANT ALL              ON public.order_status_events TO service_role;

-- ===========================================================================
-- Inventory history
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.inventory_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id      uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  delta_available int  NOT NULL DEFAULT 0,
  delta_reserved  int  NOT NULL DEFAULT 0,
  reason          text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_events_product_id_idx
  ON public.inventory_events (product_id);

ALTER TABLE public.inventory_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read inventory events"   ON public.inventory_events;
DROP POLICY IF EXISTS "service inventory events"      ON public.inventory_events;

CREATE POLICY "staff read inventory events" ON public.inventory_events
  FOR SELECT TO authenticated
  USING (public.can_manage_catalog(auth.uid()));

CREATE POLICY "service inventory events" ON public.inventory_events
  FOR INSERT TO service_role
  WITH CHECK (true);

GRANT SELECT ON public.inventory_events TO authenticated;
GRANT ALL    ON public.inventory_events TO service_role;

-- ===========================================================================
-- Audit logs
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      public.audit_action NOT NULL DEFAULT 'other',
  entity_type text NOT NULL,
  entity_id   text,
  payload     jsonb NOT NULL DEFAULT '{}',
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read audit"   ON public.audit_logs;
DROP POLICY IF EXISTS "staff insert audit" ON public.audit_logs;

CREATE POLICY "staff read audit" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()));

CREATE POLICY "staff insert audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_member(auth.uid()));

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL              ON public.audit_logs TO service_role;

-- ===========================================================================
-- System config (bootstrap flag)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.system_config (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner read system config"   ON public.system_config;
DROP POLICY IF EXISTS "service system config"      ON public.system_config;

CREATE POLICY "owner read system config" ON public.system_config
  FOR SELECT TO authenticated
  USING (public.is_owner(auth.uid()));

CREATE POLICY "service system config" ON public.system_config
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.system_config (key, value)
VALUES ('bootstrap_completed', '{\"completed\":false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Addendum A2: extend audit_action enum for catalog, inventory, and team events

DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'category_created'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'category_updated'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'category_deleted'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'inventory_changed'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'invite_created'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.audit_action ADD VALUE 'role_assigned'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx
  ON public.audit_logs (entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON public.audit_logs (action, created_at DESC);

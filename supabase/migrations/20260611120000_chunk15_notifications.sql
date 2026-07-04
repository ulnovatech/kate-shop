-- Chunk 15: Notifications Phase 1 — outbox + message templates

DO $$ BEGIN
  CREATE TYPE public.notification_event AS ENUM (
    'order_placed', 'payment_confirmed', 'order_shipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('whatsapp', 'email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      public.notification_event NOT NULL,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  recipient_phone text,
  recipient_email text,
  channel         public.notification_channel NOT NULL DEFAULT 'whatsapp',
  subject         text,
  body            text NOT NULL,
  status          public.notification_status NOT NULL DEFAULT 'pending',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  error_message   text
);

CREATE INDEX IF NOT EXISTS notification_outbox_status_idx
  ON public.notification_outbox (status, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_outbox_order_id_idx
  ON public.notification_outbox (order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read notifications" ON public.notification_outbox;
DROP POLICY IF EXISTS "staff update notifications" ON public.notification_outbox;

CREATE POLICY "staff read notifications" ON public.notification_outbox
  FOR SELECT TO authenticated
  USING (public.can_manage_orders(auth.uid()));

CREATE POLICY "staff update notifications" ON public.notification_outbox
  FOR UPDATE TO authenticated
  USING (public.can_manage_orders(auth.uid()))
  WITH CHECK (public.can_manage_orders(auth.uid()));

GRANT SELECT, UPDATE ON public.notification_outbox TO authenticated;
GRANT ALL ON public.notification_outbox TO service_role;

-- Message templates (admin-editable placeholders: {{customer_name}}, {{order_reference}}, etc.)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS notify_template_order_placed text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notify_template_payment_confirmed text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notify_template_order_shipped text DEFAULT '';

UPDATE public.settings
SET
  notify_template_order_placed = COALESCE(
    NULLIF(notify_template_order_placed, ''),
    'Hi {{customer_name}}, we received your order {{order_reference}} for {{grand_total}}. We''ll confirm payment shortly. — Kate shop'
  ),
  notify_template_payment_confirmed = COALESCE(
    NULLIF(notify_template_payment_confirmed, ''),
    'Hi {{customer_name}}, payment received for order {{order_reference}} ({{payment_amount}}). Your order is confirmed! — Kate shop'
  ),
  notify_template_order_shipped = COALESCE(
    NULLIF(notify_template_order_shipped, ''),
    'Hi {{customer_name}}, your order {{order_reference}} has shipped and is on its way to {{delivery_area}}. — Kate shop'
  )
WHERE id = 1;

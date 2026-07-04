-- Progressive customer identity: phone + local session (no mandatory auth accounts)

-- Wishlist keyed by customer_id (progressive profile from checkout)
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_items
  ALTER COLUMN auth_user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_items_customer_product_unique'
  ) THEN
    ALTER TABLE public.wishlist_items
      ADD CONSTRAINT wishlist_items_customer_product_unique
      UNIQUE (customer_id, product_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS wishlist_items_customer_idx
  ON public.wishlist_items (customer_id);

-- OTP challenges for optional phone verification (order history on new devices)
CREATE TABLE IF NOT EXISTS public.customer_phone_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_phone_verifications_phone_idx
  ON public.customer_phone_verifications (phone, created_at DESC);

ALTER TABLE public.customer_phone_verifications ENABLE ROW LEVEL SECURITY;

-- Service role only (accessed via server functions)
REVOKE ALL ON public.customer_phone_verifications FROM anon, authenticated;

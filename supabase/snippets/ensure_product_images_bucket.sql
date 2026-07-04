-- Run in SQL Editor if npm run db:ensure-storage cannot be used (missing service role key).
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

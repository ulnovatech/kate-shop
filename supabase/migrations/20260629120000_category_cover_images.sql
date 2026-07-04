-- Category cover art for storefront chips and admin wizard
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS cover_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS cover_medium_url text,
  ADD COLUMN IF NOT EXISTS cover_full_url text;

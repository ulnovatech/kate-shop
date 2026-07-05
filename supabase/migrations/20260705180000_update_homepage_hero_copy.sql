-- Refresh legacy jewelry-only homepage hero copy for Kate's general retail positioning.
UPDATE public.settings
SET
  hero_title = 'Good taste, in one place.',
  hero_subtitle = 'Jewelry, clothing, food stuffs and more — Kate''s has what you''re looking for.'
WHERE id = 1
  AND (
    hero_title IS NULL
    OR btrim(hero_title) = ''
    OR hero_title IN (
      'Timeless jewelry, crafted for you',
      'Timeless jewelry, crafted in Kampala'
    )
  )
  AND (
    hero_subtitle IS NULL
    OR btrim(hero_subtitle) = ''
    OR hero_subtitle IN (
      'Discover handpicked earrings, necklaces, watches, bangles and rings from Kate Jewels.',
      'Discover handpicked earrings, necklaces, watches, bangles and rings — delivered across Kampala, Uganda.'
    )
  );

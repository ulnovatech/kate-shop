-- Addendum A6: 3-level category hierarchy (parent_id, max depth 3)

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx
  ON public.categories (parent_id)
  WHERE deleted_at IS NULL;

-- Depth from root: 1 = top level, 2 = subcategory, 3 = leaf tier
CREATE OR REPLACE FUNCTION public.category_depth(p_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH RECURSIVE chain AS (
    SELECT id, parent_id, 1 AS depth
    FROM public.categories
    WHERE id = p_id
    UNION ALL
    SELECT c.id, c.parent_id, chain.depth + 1
    FROM public.categories c
    INNER JOIN chain ON c.id = chain.parent_id
  )
  SELECT COALESCE(MAX(depth), 0) FROM chain;
$$;

CREATE OR REPLACE FUNCTION public.categories_validate_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_parent_depth int := 0;
  v_old_depth int;
  v_new_depth int;
  v_delta int;
  v_max_after int;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'Category cannot be its own parent';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.categories
      WHERE id = NEW.parent_id AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Parent category not found';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      IF EXISTS (
        WITH RECURSIVE descendants AS (
          SELECT id FROM public.categories WHERE parent_id = NEW.id
          UNION ALL
          SELECT c.id
          FROM public.categories c
          INNER JOIN descendants d ON c.parent_id = d.id
        )
        SELECT 1 FROM descendants WHERE id = NEW.parent_id
      ) THEN
        RAISE EXCEPTION 'Category cannot be moved under its own descendant';
      END IF;
    END IF;

    v_parent_depth := public.category_depth(NEW.parent_id);
    IF v_parent_depth >= 3 THEN
      RAISE EXCEPTION 'Max category depth is 3 levels';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_new_depth := CASE WHEN NEW.parent_id IS NULL THEN 1 ELSE v_parent_depth + 1 END;
    IF v_new_depth > 3 THEN
      RAISE EXCEPTION 'Max category depth is 3 levels';
    END IF;
    RETURN NEW;
  END IF;

  v_old_depth := public.category_depth(NEW.id);
  v_new_depth := CASE WHEN NEW.parent_id IS NULL THEN 1 ELSE v_parent_depth + 1 END;
  v_delta := v_new_depth - v_old_depth;

  IF v_new_depth > 3 THEN
    RAISE EXCEPTION 'Max category depth is 3 levels';
  END IF;

  IF v_delta <> 0 AND OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    WITH RECURSIVE tree AS (
      SELECT id, public.category_depth(id) AS d
      FROM public.categories
      WHERE id = NEW.id
      UNION ALL
      SELECT c.id, public.category_depth(c.id)
      FROM public.categories c
      INNER JOIN tree t ON c.parent_id = t.id
    )
    SELECT COALESCE(MAX(d + v_delta), v_new_depth)
    INTO v_max_after
    FROM tree;

    IF v_max_after > 3 THEN
      RAISE EXCEPTION 'Move would exceed max category depth of 3 levels';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_validate_hierarchy_trg ON public.categories;
CREATE TRIGGER categories_validate_hierarchy_trg
  BEFORE INSERT OR UPDATE OF parent_id ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.categories_validate_hierarchy();

GRANT EXECUTE ON FUNCTION public.category_depth(uuid) TO authenticated, service_role;

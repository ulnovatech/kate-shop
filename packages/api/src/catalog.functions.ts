import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";

const suggestSchema = z.object({
  q: z.string().trim().min(1).max(80),
});

export type SearchSuggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
};

/** Lightweight typeahead for shop search (max 8 results). */
export const searchProductSuggestions = createServerFn({ method: "POST" })
  .inputValidator(suggestSchema)
  .handler(async ({ data }) => {
    const term = data.q.trim();
    if (term.length < 2) return [];

    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price")
      .eq("is_visible", true)
      .eq("is_active", true)
      .is("archived_at", null)
      .is("deleted_at", null)
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw new Error(error.message);
    return (rows ?? []) as SearchSuggestion[];
  });

/** Recycle bin entity types supported in A3. */
export type RecycleEntityType = "product" | "category";

export type RecycleItem = {
  entity_type: RecycleEntityType;
  id: string;
  name: string;
  slug: string;
  deleted_at: string;
  deleted_by: string | null;
  meta?: string | null;
};

export function recycleEntityLabel(type: RecycleEntityType): string {
  return type === "product" ? "Product" : "Category";
}

export function isRecycled(row: { deleted_at?: string | null }): boolean {
  return row.deleted_at != null;
}

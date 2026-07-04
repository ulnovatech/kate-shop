import type { CategoryRecord } from "@/lib/categories";

export type AdminCategory = CategoryRecord & { is_hidden: boolean };

export type CategoryDraftRow = {
  key: string;
  parentId: string | null;
};

export const MAX_CATEGORY_DEPTH = 3;

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_hidden?: boolean;
  cover_image_url?: string | null;
  cover_thumbnail_url?: string | null;
  cover_medium_url?: string | null;
  cover_full_url?: string | null;
};

export type CategoryTreeNode = CategoryRecord & { children: CategoryTreeNode[] };

export function buildCategoryTree(categories: CategoryRecord[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    map.set(category.id, { ...category, children: [] });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortNodes(n.children));
  };

  sortNodes(roots);
  return roots;
}

export function categoryDepth(id: string, categories: CategoryRecord[]): number {
  let depth = 0;
  let current = categories.find((c) => c.id === id);
  const seen = new Set<string>();

  while (current) {
    depth += 1;
    if (!current.parent_id) break;
    if (seen.has(current.parent_id)) break;
    seen.add(current.parent_id);
    current = categories.find((c) => c.id === current!.parent_id);
  }

  return depth;
}

export function getDescendantIds(id: string, categories: CategoryRecord[]): string[] {
  const byParent = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = byParent.get(category.parent_id) ?? [];
    siblings.push(category.id);
    byParent.set(category.parent_id, siblings);
  }

  const ids: string[] = [];
  const walk = (nodeId: string) => {
    ids.push(nodeId);
    for (const childId of byParent.get(nodeId) ?? []) walk(childId);
  };
  walk(id);
  return ids;
}

export function getRootCategories(categories: CategoryRecord[]): CategoryRecord[] {
  return categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function getChildCategories(
  parentId: string | null,
  categories: CategoryRecord[],
): CategoryRecord[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function getCategoryBreadcrumb(
  slug: string,
  categories: CategoryRecord[],
): CategoryRecord[] {
  const target = categories.find((c) => c.slug === slug);
  if (!target) return [];

  const trail: CategoryRecord[] = [];
  let current: CategoryRecord | undefined = target;
  const seen = new Set<string>();

  while (current) {
    trail.unshift(current);
    if (!current.parent_id || seen.has(current.parent_id)) break;
    seen.add(current.parent_id);
    current = categories.find((c) => c.id === current!.parent_id);
  }

  return trail;
}

export type CategorySelectOption = {
  id: string;
  label: string;
  depth: number;
};

export function flattenCategoryTreeForSelect(tree: CategoryTreeNode[]): CategorySelectOption[] {
  const options: CategorySelectOption[] = [];

  const walk = (nodes: CategoryTreeNode[], depth: number) => {
    for (const node of nodes) {
      options.push({ id: node.id, label: node.name, depth });
      if (node.children.length) walk(node.children, depth + 1);
    }
  };

  walk(tree, 1);
  return options;
}

export function categorySelectIndent(depth: number): string {
  return depth > 1 ? `${"—".repeat(depth - 1)} ` : "";
}

export function validParentOptions(
  categories: CategoryRecord[],
  excludeId?: string,
): CategoryRecord[] {
  return categories.filter((c) => {
    if (excludeId && c.id === excludeId) return false;
    if (excludeId && getDescendantIds(excludeId, categories).includes(c.id)) return false;
    return categoryDepth(c.id, categories) < MAX_CATEGORY_DEPTH;
  });
}

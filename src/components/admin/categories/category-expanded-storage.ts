const EXPANDED_STORAGE_KEY = "admin-categories-expanded";

export function readExpandedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function writeExpandedIds(ids: Set<string>) {
  sessionStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...ids]));
}

const RECENT_KEY = "kate-recent-searches";
const MAX_RECENT = 6;

export function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(term: string): void {
  if (typeof window === "undefined") return;
  const trimmed = term.trim();
  if (!trimmed) return;
  try {
    const prev = loadRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([trimmed, ...prev].slice(0, MAX_RECENT)));
  } catch {
    // Ignore quota errors.
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Ignore.
  }
}

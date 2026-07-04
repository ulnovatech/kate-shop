export type KeyboardShortcut = {
  id: string;
  label: string;
  /** Display tokens, e.g. ["⌘", "K"] */
  keys: string[];
};

export const ADMIN_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { id: "palette", label: "Open command palette", keys: ["⌘", "K"] },
  { id: "shortcuts", label: "Show keyboard shortcuts", keys: ["?"] },
  { id: "focus", label: "Toggle focus mode", keys: ["⌘", "⇧", "F"] },
  { id: "today", label: "Go to Today", keys: ["G", "then", "H"] },
  { id: "orders", label: "Go to Orders", keys: ["G", "then", "O"] },
  { id: "products", label: "Go to Products", keys: ["G", "then", "P"] },
];

export function shortcutKeysForPlatform(keys: string[]): string {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  return keys
    .map((key) => {
      if (key === "⌘") return isMac ? "⌘" : "Ctrl";
      if (key === "⇧") return "Shift";
      return key;
    })
    .join(isMac ? "" : "+")
    .replace(/\+\+/g, "+");
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable === true
  );
}

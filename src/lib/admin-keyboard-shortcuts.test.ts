import { describe, expect, it } from "vitest";
import { isEditableTarget, shortcutKeysForPlatform } from "@/lib/admin-keyboard-shortcuts";

describe("admin keyboard shortcuts", () => {
  it("formats palette shortcut for display", () => {
    expect(shortcutKeysForPlatform(["⌘", "K"]).length).toBeGreaterThan(0);
  });

  it("detects editable targets", () => {
    const input = document.createElement("input");
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListSelection } from "@/hooks/use-list-selection";

describe("useListSelection", () => {
  it("enters selection mode with one item", () => {
    const { result } = renderHook(() => useListSelection(["a", "b"]));

    act(() => result.current.enterSelectionWith("a"));

    expect(result.current.selectionMode).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedIds.has("a")).toBe(true);
  });

  it("toggles all on page", () => {
    const { result } = renderHook(() => useListSelection(["a", "b"]));

    act(() => {
      result.current.toggleSelectionMode(true);
      result.current.toggleAllOnPage();
    });

    expect(result.current.allOnPageSelected).toBe(true);

    act(() => result.current.toggleAllOnPage());

    expect(result.current.selectedCount).toBe(0);
  });
});

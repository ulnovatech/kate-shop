import { describe, expect, it, vi, beforeEach } from "vitest";
import { copyTextToClipboard } from "@/lib/clipboard";

describe("copyTextToClipboard", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when clipboard API is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    expect(await copyTextToClipboard("hello")).toBe(false);
  });

  it("writes text and returns true on success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    expect(await copyTextToClipboard("KS-2026-0042")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("KS-2026-0042");
  });

  it("returns false when writeText throws", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    expect(await copyTextToClipboard("test")).toBe(false);
  });
});

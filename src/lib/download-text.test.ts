import { describe, expect, it, vi, afterEach } from "vitest";
import { downloadTextFile } from "./download-text";

describe("downloadTextFile", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("appends and removes a download anchor", () => {
    const click = vi.fn();
    const anchor = document.createElement("a");
    anchor.click = click;
    const spy = vi.spyOn(document, "createElement").mockReturnValue(anchor);

    downloadTextFile("orders.csv", "a,b\n1,2");

    expect(click).toHaveBeenCalled();
    expect(anchor.download).toBe("orders.csv");
    expect(document.body.contains(anchor)).toBe(false);
    spy.mockRestore();
  });
});

import { describe, expect, it } from "vitest";
import { TimeoutError, withTimeout } from "@/lib/with-timeout";

describe("withTimeout", () => {
  it("resolves when promise finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 500)).resolves.toBe("ok");
  });

  it("rejects when promise exceeds timeout", async () => {
    await expect(withTimeout(new Promise<string>(() => {}), 50, "Test op")).rejects.toBeInstanceOf(
      TimeoutError,
    );
  });
});

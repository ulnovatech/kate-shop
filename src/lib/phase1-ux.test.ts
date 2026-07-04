import { describe, expect, it } from "vitest";
import { humanizeError } from "@/lib/errors";
import { humanInventoryState, humanOrderStatus, nextOrderActionLabel } from "@/lib/human-labels";

describe("humanizeError", () => {
  it("does not expose row-level security wording", () => {
    expect(
      humanizeError(new Error("new row violates row-level security policy"), {
        action: "update orders",
      }),
    ).toBe(
      "You do not have permission to update orders. Ask the shop owner to update your access.",
    );
  });

  it("maps duplicate errors to human copy", () => {
    expect(humanizeError(new Error("duplicate key value violates unique constraint"))).toBe(
      "That already exists. Use a different name or reference.",
    );
  });

  it("uses fallback for unknown errors", () => {
    expect(
      humanizeError(new Error("supabase internal edge-case"), { fallback: "Try again." }),
    ).toBe("Try again.");
  });
});

describe("human labels", () => {
  it("formats order statuses in natural language", () => {
    expect(humanOrderStatus("awaiting_payment")).toBe("Waiting for payment");
    expect(humanOrderStatus("shipped")).toBe("On the way");
  });

  it("formats inventory states", () => {
    expect(humanInventoryState("reserved")).toBe("Stock reserved");
    expect(humanInventoryState(null)).toBe("Not checked");
  });

  it("formats next order actions", () => {
    expect(nextOrderActionLabel("packed")).toBe("Send for delivery");
  });
});

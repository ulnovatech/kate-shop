import { describe, expect, it } from "vitest";
import { z } from "zod";
import { staffPinSchema } from "@kate/api/staff-pin.server";

/** Mirrors setStaffPinWithCurrentPin validation in auth.functions.ts */
const setStaffPinWithCurrentPinSchema = z
  .object({
    currentPin: staffPinSchema,
    pin: staffPinSchema,
  })
  .refine((data) => data.currentPin !== data.pin, {
    message: "Choose a PIN that is different from your current PIN.",
    path: ["pin"],
  });

describe("setStaffPinWithCurrentPin schema", () => {
  it("requires different current and new PINs", () => {
    const same = setStaffPinWithCurrentPinSchema.safeParse({
      currentPin: "12345",
      pin: "12345",
    });
    expect(same.success).toBe(false);

    const ok = setStaffPinWithCurrentPinSchema.safeParse({
      currentPin: "12345",
      pin: "56789",
    });
    expect(ok.success).toBe(true);
  });
});

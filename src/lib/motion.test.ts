import { describe, expect, it } from "vitest";
import { MOTION_ENTER } from "@/lib/motion";

describe("motion tokens", () => {
  it("maps enter variants to motion-safe classes", () => {
    expect(MOTION_ENTER.fade).toContain("animate-fade-in");
    expect(MOTION_ENTER.slideUp).toContain("animate-slide-up");
    expect(MOTION_ENTER.successPop).toContain("animate-success-pop");
  });
});

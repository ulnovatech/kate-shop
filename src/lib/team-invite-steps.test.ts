import { describe, expect, it } from "vitest";
import { TEAM_INVITE_STEPS, teamInviteStepIndex } from "@/lib/team-invite-steps";

describe("team invite steps", () => {
  it("defines email, role, and send", () => {
    expect(TEAM_INVITE_STEPS.map((s) => s.id)).toEqual(["email", "role", "send"]);
  });

  it("resolves step index", () => {
    expect(teamInviteStepIndex("role")).toBe(1);
  });
});

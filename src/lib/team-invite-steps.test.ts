import { describe, expect, it } from "vitest";
import { TEAM_INVITE_STEPS, teamInviteStepIndex } from "@/lib/team-invite-steps";

describe("team invite steps", () => {
  it("defines role and link", () => {
    expect(TEAM_INVITE_STEPS.map((s) => s.id)).toEqual(["role", "link"]);
  });

  it("resolves step index", () => {
    expect(teamInviteStepIndex("link")).toBe(1);
  });
});

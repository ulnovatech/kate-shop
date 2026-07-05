export const TEAM_INVITE_STEPS = [
  { id: "role", label: "Role" },
  { id: "link", label: "Share link" },
] as const;

export type TeamInviteStepId = (typeof TEAM_INVITE_STEPS)[number]["id"];

export function teamInviteStepIndex(step: TeamInviteStepId): number {
  return TEAM_INVITE_STEPS.findIndex((s) => s.id === step);
}

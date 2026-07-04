export const TEAM_INVITE_STEPS = [
  { id: "email", label: "Email" },
  { id: "role", label: "Role" },
  { id: "send", label: "Send" },
] as const;

export type TeamInviteStepId = (typeof TEAM_INVITE_STEPS)[number]["id"];

export function teamInviteStepIndex(step: TeamInviteStepId): number {
  return TEAM_INVITE_STEPS.findIndex((s) => s.id === step);
}

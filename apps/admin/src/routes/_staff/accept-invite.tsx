import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AcceptInviteRedirect } from "@/components/admin/onboarding/accept-invite-redirect";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_staff/accept-invite")({
  staticData: { adminRouteHeading: "Accept staff invite" as const },
  validateSearch: (search) => searchSchema.parse(search),
  component: AcceptInvite,
});

function AcceptInvite() {
  const { token } = Route.useSearch();
  return <AcceptInviteRedirect token={token ?? ""} />;
}

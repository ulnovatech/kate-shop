import { createFileRoute } from "@tanstack/react-router";
import { AcceptInviteRedirect } from "@/components/admin/onboarding/accept-invite-redirect";
import { acceptInviteSearchSchema } from "@/lib/accept-invite-search";

export const Route = createFileRoute("/_staff/accept-invite")({
  staticData: { adminRouteHeading: "Accept staff invite" as const },
  validateSearch: (search) => acceptInviteSearchSchema.parse(search),
  component: AcceptInvite,
});

function AcceptInvite() {
  const { token, skip_app_probe } = Route.useSearch();
  return <AcceptInviteRedirect token={token ?? ""} skipAppProbe={skip_app_probe === "1"} />;
}

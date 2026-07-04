import { createFileRoute } from "@tanstack/react-router";
import { TeamListPage } from "@/components/admin/team/team-list-page";

export const Route = createFileRoute("/admin/team")({
  staticData: { adminPermission: "team" as const, adminRouteHeading: "Team invites" as const },
  component: AdminTeam,
});

function AdminTeam() {
  return <TeamListPage />;
}

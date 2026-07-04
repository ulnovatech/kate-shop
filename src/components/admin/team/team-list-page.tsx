import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { listAdminInvites } from "@/lib/api/invites.functions";
import { listInvitableRoles } from "@/lib/api/roles.functions";
import { TeamInviteWizard } from "./team-invite-wizard";

export function TeamListPage() {
  const { data: invitableRoles = [] } = useQuery({
    queryKey: ["invitable-roles"],
    queryFn: () => listInvitableRoles(),
  });

  const { data: invites = [], refetch } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: () => listAdminInvites(),
  });

  const defaultRoleId = invitableRoles[0]?.id ?? "";
  const roleNameById = new Map(invitableRoles.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Team invites"
        description="Invite staff with a role from your permission matrix. Links expire in 7 days and work once."
        meta={`${invites.length} invite${invites.length === 1 ? "" : "s"}`}
      />

      <TeamInviteWizard
        invitableRoles={invitableRoles}
        defaultRoleId={defaultRoleId}
        onInviteCreated={() => void refetch()}
      />

      <section>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Users className="h-4 w-4" /> Recent invites
        </h2>
        <ul className="mt-4 divide-y overflow-hidden rounded-lg border bg-card">
          {invites.length === 0 ? (
            <li className="p-6 text-sm text-muted-foreground">No invites yet.</li>
          ) : (
            invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-sm sm:px-5"
              >
                <span>
                  <span className="font-medium">{inv.email}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ·{" "}
                    {inv.role_name ??
                      (inv.role_id ? roleNameById.get(inv.role_id) : undefined) ??
                      inv.role}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {inv.used_at
                    ? "Used"
                    : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

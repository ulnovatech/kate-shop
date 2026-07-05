import { createFileRoute } from "@tanstack/react-router";
import { NotificationListPage } from "@/components/admin/notifications";
import { useListFilters } from "@/hooks/use-list-filters";
import {
  ADMIN_NOTIFICATION_LIST_DEFAULTS,
  adminNotificationListSearchSchema,
  parseAdminNotificationListFilters,
  serializeAdminNotificationListFilters,
} from "@/lib/list-filters";

export const Route = createFileRoute("/_staff/notifications")({
  staticData: { adminPermission: "orders" as const, adminRouteHeading: "Notifications" as const },
  validateSearch: (search) => adminNotificationListSearchSchema.parse(search),
  component: AdminNotifications,
});

function AdminNotifications() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { applied, draft, setField, hasActiveFilters, clearFilters } = useListFilters({
    search,
    navigate,
    defaults: ADMIN_NOTIFICATION_LIST_DEFAULTS,
    parse: parseAdminNotificationListFilters,
    serialize: serializeAdminNotificationListFilters,
  });

  return (
    <NotificationListPage
      applied={applied}
      draft={draft}
      hasActiveFilters={hasActiveFilters}
      onStatusChange={(status) => setField("status", status)}
      onClearFilters={clearFilters}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { InventoryPage } from "@/components/admin/inventory/inventory-page";

export const Route = createFileRoute("/admin/inventory")({
  staticData: { adminPermission: "catalog" as const },
  component: AdminInventory,
});

function AdminInventory() {
  return <InventoryPage />;
}

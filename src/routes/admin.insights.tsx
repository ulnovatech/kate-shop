import { createFileRoute, redirect } from "@tanstack/react-router";

/** IA-02: Insights merged into Today — keep route as a deep-link alias. */
export const Route = createFileRoute("/admin/insights")({
  staticData: { adminPermission: "dashboard" as const },
  beforeLoad: () => {
    throw redirect({
      to: "/admin",
      hash: "revenue",
    });
  },
});

import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Legacy route — customer accounts use progressive phone identity, not passwords. */
export const Route = createFileRoute("/account/login")({
  component: () => <Navigate to="/orders" replace />,
});

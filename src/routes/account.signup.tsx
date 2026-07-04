import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Legacy route — customers are created automatically at checkout. */
export const Route = createFileRoute("/account/signup")({
  component: () => <Navigate to="/orders" replace />,
});

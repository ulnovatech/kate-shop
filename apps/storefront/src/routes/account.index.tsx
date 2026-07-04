import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Legacy route — order history lives at /orders. */
export const Route = createFileRoute("/account/")({
  component: () => <Navigate to="/orders" replace />,
});

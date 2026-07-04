import { createFileRoute } from "@tanstack/react-router";
import { getHealthCheckResult } from "@/lib/observability/health.server";

export const Route = createFileRoute("/health.json")({
  server: {
    handlers: {
      GET: async () => {
        const result = await getHealthCheckResult();
        const status = result.status === "unhealthy" ? 503 : 200;
        return new Response(JSON.stringify(result), {
          status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});

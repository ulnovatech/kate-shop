import { createFileRoute } from "@tanstack/react-router";
import { buildAdminWebManifest } from "@/lib/pwa";

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async () => {
        const manifest = buildAdminWebManifest();

        return new Response(JSON.stringify(manifest), {
          headers: {
            "Content-Type": "application/manifest+json; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

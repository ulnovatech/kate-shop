import { createFileRoute } from "@tanstack/react-router";
import { loadStoreBranding } from "@/lib/api/branding.server";
import { buildWebManifest } from "@/lib/pwa";
import { defaultSiteDescription } from "@/lib/seo";

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async () => {
        const branding = await loadStoreBranding();
        const manifest = buildWebManifest({
          shopName: branding.shopName,
          description:
            branding.metaDescription || branding.heroSubtitle || defaultSiteDescription(branding),
        });

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

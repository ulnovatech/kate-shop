import { createFileRoute } from "@tanstack/react-router";
import { getRobotsTxt } from "@/lib/api/seo.server";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = await getRobotsTxt();
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logStructured } from "@/lib/observability/logger.server";

const clientErrorSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  name: z.string().trim().max(120).optional(),
  stack: z.string().max(12000).optional(),
  url: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(80).optional(),
  componentStack: z.string().max(12000).optional(),
});

export const reportClientError = createServerFn({ method: "POST" })
  .inputValidator(clientErrorSchema)
  .handler(async ({ data }) => {
    logStructured("error", "client_error", {
      client: {
        message: data.message,
        name: data.name,
        stack: data.stack,
        url: data.url,
        source: data.source ?? "client",
        componentStack: data.componentStack,
      },
    });

    return { ok: true as const };
  });

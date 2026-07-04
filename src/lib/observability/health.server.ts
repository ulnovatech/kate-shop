import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type HealthCheckResult = {
  status: HealthStatus;
  service: "kate-shop";
  version: string;
  uptimeSeconds: number;
  checks: {
    app: "ok";
    supabase: "ok" | "error" | "skipped";
  };
  timestamp: string;
};

const APP_VERSION = process.env.npm_package_version ?? "0.0.0";
const startedAt = Date.now();

export function resolveHealthStatus(
  supabase: HealthCheckResult["checks"]["supabase"],
): HealthStatus {
  return supabase === "error" ? "degraded" : "healthy";
}

async function pingSupabase(timeoutMs = 2500): Promise<"ok" | "error" | "skipped"> {
  if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "skipped";
  }

  try {
    const result = await Promise.race([
      supabaseAdmin.from("settings").select("id").limit(1).maybeSingle(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("supabase health timeout")), timeoutMs),
      ),
    ]);

    if (result.error) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

export async function getHealthCheckResult(): Promise<HealthCheckResult> {
  const supabase = await pingSupabase();

  return {
    status: resolveHealthStatus(supabase),
    service: "kate-shop",
    version: APP_VERSION,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    checks: {
      app: "ok",
      supabase,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function healthCheckResponse(request: Request): Promise<Response> {
  const result = await getHealthCheckResult();
  const httpStatus = result.status === "unhealthy" ? 503 : 200;

  return new Response(JSON.stringify(result), {
    status: httpStatus,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(request.headers.get("accept")?.includes("text/html")
        ? {}
        : { "access-control-allow-origin": "*" }),
    },
  });
}

export function isHealthPath(pathname: string): boolean {
  return pathname === "/health.json" || pathname === "/health";
}

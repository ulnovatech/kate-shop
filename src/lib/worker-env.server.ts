import process from "node:process";

declare global {
  /** Nitro sets this before routing dynamic requests on Cloudflare Workers. */
  var __env__: Record<string, unknown> | undefined;
}

function isBindableEnvValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Copy Cloudflare Worker bindings into process.env for the current request.
 * Nitro's SSR bridge calls our fetch handler without the env argument, so we
 * also read globalThis.__env__ set by the outer Worker entry.
 */
export function bindWorkerRuntimeEnv(env?: unknown): void {
  const source =
    env && typeof env === "object" && !Array.isArray(env)
      ? (env as Record<string, unknown>)
      : globalThis.__env__;

  if (!source) return;

  for (const [key, value] of Object.entries(source)) {
    if (key === "ASSETS") continue;
    if (isBindableEnvValue(value)) {
      process.env[key] = value;
    }
  }
}

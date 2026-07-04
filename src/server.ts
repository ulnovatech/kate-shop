import { loadEnv } from "../scripts/load-env.mjs";

loadEnv();

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { healthCheckResponse, isHealthPath } from "./lib/observability/health.server";
import {
  bindRequestId,
  clearRequestId,
  logServerError,
  logStructured,
} from "./lib/observability/logger.server";
import { getRequestIdHeaderName, resolveRequestId } from "./lib/observability/request-id";
import { applySecurityHeaders } from "./lib/security-headers";
import { bindWorkerRuntimeEnv } from "./lib/worker-env.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set(getRequestIdHeaderName(), requestId);
  applySecurityHeaders(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const swallowed = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  logServerError(swallowed, { source: "ssr_swallowed" });
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    bindWorkerRuntimeEnv(env);

    const url = new URL(request.url);

    if (isHealthPath(url.pathname)) {
      return healthCheckResponse(request);
    }

    const requestId = resolveRequestId(request.headers.get(getRequestIdHeaderName()));
    bindRequestId(requestId);
    const started = Date.now();

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);

      logStructured("info", "request", {
        method: request.method,
        path: url.pathname,
        status: normalized.status,
        durationMs: Date.now() - started,
      });

      return withRequestId(normalized, requestId);
    } catch (error) {
      logServerError(error, {
        method: request.method,
        path: url.pathname,
        durationMs: Date.now() - started,
      });
      if (url.pathname.includes("/_serverFn/")) {
        throw error;
      }
      return withRequestId(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        requestId,
      );
    } finally {
      clearRequestId();
    }
  },
};

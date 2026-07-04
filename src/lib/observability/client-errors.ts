import { reportClientError } from "@/lib/api/observability.functions";

let initialized = false;

function normalizeClientError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export function captureClientError(error: unknown, context: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  const normalized = normalizeClientError(error);

  if (import.meta.env.DEV) {
    console.error("[client-error]", normalized, context);
  }

  void reportClientError({
    data: {
      message: normalized.message,
      name: normalized.name,
      stack: normalized.stack,
      url: window.location.href,
      ...context,
    },
  }).catch(() => {
    // Best-effort reporting — never throw from error handlers.
  });
}

export function initClientErrorReporting(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    captureClientError(event.error ?? event.message, {
      source: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    captureClientError(event.reason, { source: "unhandledrejection" });
  });
}

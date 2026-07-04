import { getRequestIdHeaderName, resolveRequestId } from "@/lib/observability/request-id";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type StructuredLog = {
  level: LogLevel;
  event: string;
  ts: string;
  requestId?: string;
  [key: string]: unknown;
};

let activeRequestId: string | undefined;

export function bindRequestId(requestId: string): void {
  activeRequestId = requestId;
}

export function clearRequestId(): void {
  activeRequestId = undefined;
}

export function currentRequestId(): string | undefined {
  return activeRequestId;
}

export function requestIdFromHeaders(headers: Headers): string {
  return resolveRequestId(headers.get(getRequestIdHeaderName()));
}

export function logStructured(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const entry: StructuredLog = {
    level,
    event,
    ts: new Date().toISOString(),
    ...(activeRequestId ? { requestId: activeRequestId } : {}),
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logServerError(error: unknown, context: Record<string, unknown> = {}): void {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  logStructured("error", "server_error", { ...context, error: normalized });
}

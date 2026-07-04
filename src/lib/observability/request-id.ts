const REQUEST_ID_HEADER = "x-request-id";

export function getRequestIdHeaderName(): string {
  return REQUEST_ID_HEADER;
}

export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveRequestId(incoming: string | null | undefined): string {
  const trimmed = incoming?.trim();
  if (trimmed && trimmed.length <= 128) return trimmed;
  return generateRequestId();
}

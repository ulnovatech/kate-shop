type HumanizedErrorOptions = {
  fallback?: string;
  action?: string;
};

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

/** Flatten error + cause chain for connectivity detection. */
function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    const part = messageOf(current);
    if (part) parts.push(part);
    if (current && typeof current === "object" && "cause" in current) {
      current = (current as { cause?: unknown }).cause;
    } else {
      break;
    }
  }
  return parts.join(" ").toLowerCase();
}

export function isUnauthorizedError(error: unknown): boolean {
  const message = messageOf(error).toLowerCase();
  return (
    message.includes("unauthorized") ||
    message.includes("invalid token") ||
    message.includes("no authorization header")
  );
}

/** True when the browser cannot reach the local Vite/TanStack dev server. */
export function isDevServerUnreachableError(error: unknown): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return false;
  }
  const message = messageOf(error).toLowerCase();
  return message.includes("failed to fetch") || message.includes("network");
}

export function devServerUnreachableMessage(): string {
  return "The dev server is not running. In your project folder run npm run dev, then refresh this page.";
}

/** True when Supabase or another remote backend cannot be reached (timeouts, network). */
export function isSupabaseUnreachableError(error: unknown): boolean {
  const text = errorText(error);
  return (
    text.includes("connect timeout") ||
    text.includes("und_err_connect_timeout") ||
    text.includes("setup check timed out") ||
    text.includes("bootstrap check timed out") ||
    text.includes("fetch failed") ||
    (text.includes("timed out") && text.includes("supabase"))
  );
}

export function supabaseUnreachableMessage(): string {
  return "Could not reach Supabase. Check your internet connection, VPN, or firewall, then refresh this page.";
}

export function humanizeError(error: unknown, options: HumanizedErrorOptions = {}): string {
  const fallback = options.fallback ?? "Something went wrong. Please try again.";
  const action = options.action ?? "complete this action";
  const message = messageOf(error).toLowerCase();

  if (!message) return fallback;

  if (
    message.includes("content security policy") ||
    message.includes("unsafe-eval") ||
    (message.includes("eval") && message.includes("refused"))
  ) {
    return "Your browser blocked part of the app. Hard-refresh this page or disable strict security extensions, then try again.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    if (isDevServerUnreachableError(error)) {
      return devServerUnreachableMessage();
    }
    return "We could not reach the server. Check your internet connection and try again.";
  }

  if (message.includes("timed out") || message.includes("timeout")) {
    if (isSupabaseUnreachableError(error)) {
      return supabaseUnreachableMessage();
    }
    return "This is taking longer than expected. Please try again in a moment.";
  }

  if (
    message.includes("unauthorized") ||
    message.includes("invalid token") ||
    message.includes("jwt") ||
    message.includes("session") ||
    (message.includes("auth") && !message.includes("github"))
  ) {
    return "Your session needs a refresh. Please sign in again.";
  }

  if (
    message.includes("github release token was rejected") ||
    message.includes("github release trigger failed")
  ) {
    return messageOf(error);
  }

  if (
    message.includes("forbidden") ||
    message.includes("permission") ||
    message.includes("row-level")
  ) {
    return `You do not have permission to ${action}. Ask the shop owner to update your access.`;
  }

  if (message.includes("duplicate") || message.includes("unique constraint")) {
    return "That already exists. Use a different name or reference.";
  }

  if (message.includes("foreign key") || message.includes("violates constraint")) {
    return "This item is connected to other records. Update those first, then try again.";
  }

  if (message.includes("not found") || message.includes("no rows")) {
    return "We could not find that record. It may have been changed or removed.";
  }

  if (message.includes("invalid") && message.includes("uuid")) {
    return "That link looks incomplete. Go back and try opening it again.";
  }

  return fallback;
}

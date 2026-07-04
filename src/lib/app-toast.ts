import { toast, type ExternalToast } from "sonner";

export type AppToastOptions = ExternalToast;

const DURATIONS = {
  success: 4000,
  info: 5000,
  warning: 6000,
  recoverableError: 8000,
} as const;

/**
 * DS-05 — consistent toast hierarchy for admin + storefront.
 * Prefer this over raw `toast.*` for new code; existing call sites can migrate gradually.
 */
export const appToast = {
  success(message: string, options?: AppToastOptions) {
    return toast.success(message, { duration: DURATIONS.success, ...options });
  },

  info(message: string, options?: AppToastOptions) {
    return toast.message(message, {
      duration: DURATIONS.info,
      className: "app-toast-info",
      ...options,
    });
  },

  warning(message: string, options?: AppToastOptions) {
    return toast.warning(message, { duration: DURATIONS.warning, ...options });
  },

  /** Errors the user can retry or fix (validation, network blips). */
  recoverableError(message: string, options?: AppToastOptions) {
    return toast.error(message, { duration: DURATIONS.recoverableError, ...options });
  },

  /** Blocking failures — stays until dismissed. */
  blockingError(message: string, options?: AppToastOptions) {
    return toast.error(message, {
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
      ...options,
    });
  },
};

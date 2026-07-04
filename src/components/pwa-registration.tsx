import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

/**
 * Registers the service worker in production and reloads when a new version is ready.
 * Push subscription wiring lives in {@link subscribeToPushNotifications} (Phase 2).
 */
export function PwaRegistration() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const update = registerSW({
      immediate: true,
      onOfflineReady() {
        // Static shell + cached assets available offline
      },
    });

    void update;
  }, []);

  return null;
}

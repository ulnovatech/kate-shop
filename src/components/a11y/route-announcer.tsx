import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Announces route changes to screen readers after document.title updates (X-03).
 */
export function RouteAnnouncer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const title = typeof document !== "undefined" ? document.title.trim() : "";
      if (title) setAnnouncement(title);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}

import { useEffect } from "react";
import { initClientErrorReporting } from "@/lib/observability/client-errors";

export function ClientErrorReporting() {
  useEffect(() => {
    initClientErrorReporting();
  }, []);

  return null;
}

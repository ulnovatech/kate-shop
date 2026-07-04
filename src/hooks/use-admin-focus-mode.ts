import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kate-admin-focus-mode";

function readFocusMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useAdminFocusMode() {
  const [focusMode, setFocusMode] = useState(readFocusMode);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, focusMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [focusMode]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((on) => !on);
  }, []);

  return { focusMode, setFocusMode, toggleFocusMode };
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AdminMobileNavOverrideContextValue = {
  override: ReactNode | null;
  setMobileNavOverride: (node: ReactNode | null) => void;
};

const AdminMobileNavOverrideContext = createContext<AdminMobileNavOverrideContextValue | null>(
  null,
);

export function AdminMobileNavOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<ReactNode | null>(null);
  const setMobileNavOverride = useCallback((node: ReactNode | null) => {
    setOverride(node);
  }, []);

  const value = useMemo(
    () => ({ override, setMobileNavOverride }),
    [override, setMobileNavOverride],
  );

  return (
    <AdminMobileNavOverrideContext.Provider value={value}>
      {children}
    </AdminMobileNavOverrideContext.Provider>
  );
}

export function useAdminMobileNavOverride() {
  return useContext(AdminMobileNavOverrideContext);
}

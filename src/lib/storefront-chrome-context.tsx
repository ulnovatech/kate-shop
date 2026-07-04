import { createContext, useContext, type ReactNode } from "react";

type StorefrontChromeContextValue = {
  showTabBar: boolean;
  moreNavOpen: boolean;
  setMoreNavOpen: (open: boolean) => void;
};

const StorefrontChromeContext = createContext<StorefrontChromeContextValue | null>(null);

export function StorefrontChromeProvider({
  children,
  showTabBar,
  moreNavOpen,
  setMoreNavOpen,
}: StorefrontChromeContextValue & { children: ReactNode }) {
  return (
    <StorefrontChromeContext.Provider value={{ showTabBar, moreNavOpen, setMoreNavOpen }}>
      {children}
    </StorefrontChromeContext.Provider>
  );
}

export function useStorefrontChrome(): StorefrontChromeContextValue {
  const ctx = useContext(StorefrontChromeContext);
  if (!ctx) {
    return {
      showTabBar: false,
      moreNavOpen: false,
      setMoreNavOpen: () => {},
    };
  }
  return ctx;
}

/** Bottom tab bar height — keep in sync with StorefrontTabBar. */
export const STOREFRONT_TAB_HEIGHT = "3.5rem";

export function storefrontTabPaddingClass(show: boolean): string {
  return show ? "pb-[calc(var(--storefront-tab-height)+env(safe-area-inset-bottom))] md:pb-0" : "";
}

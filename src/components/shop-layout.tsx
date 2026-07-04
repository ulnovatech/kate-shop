import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { SkipLink } from "./skip-link";
import { RouteAnnouncer } from "@/components/a11y/route-announcer";
import { PwaInstallPrompt } from "./pwa-install-prompt";
import { SiteMobileNav } from "./site-mobile-nav";
import { StorefrontTabBar } from "./storefront-tab-bar";
import {
  StorefrontChromeProvider,
  storefrontTabPaddingClass,
} from "@/lib/storefront-chrome-context";
import { useCustomerSession } from "@/lib/customer-session-context";
import { firstName } from "@/lib/customer-session";
import { cn } from "@/lib/utils";

function useShowStorefrontTabBar(): boolean {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return !pathname.startsWith("/checkout") && !pathname.startsWith("/admin");
}

export function ShopLayout({ children }: { children: ReactNode }) {
  const showTabBar = useShowStorefrontTabBar();
  const [moreNavOpen, setMoreNavOpen] = useState(false);
  const { session } = useCustomerSession();
  const welcomeName = session?.name ? firstName(session.name) : null;

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setMoreNavOpen(false);
  }, [pathname]);

  const tabPad = storefrontTabPaddingClass(showTabBar);

  return (
    <StorefrontChromeProvider
      showTabBar={showTabBar}
      moreNavOpen={moreNavOpen}
      setMoreNavOpen={setMoreNavOpen}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <SkipLink />
        <RouteAnnouncer />
        <SiteHeader />
        <main id="main-content" className={cn("flex-1", tabPad)} tabIndex={-1}>
          {children}
        </main>
        <SiteFooter className={tabPad} />
        {showTabBar && <StorefrontTabBar />}
        <PwaInstallPrompt />
        <SiteMobileNav open={moreNavOpen} onOpenChange={setMoreNavOpen} welcomeName={welcomeName} />
      </div>
    </StorefrontChromeProvider>
  );
}

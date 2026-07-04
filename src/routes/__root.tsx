import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ShopLayout } from "@/components/shop-layout";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/lib/auth";
import { CustomerSessionProvider } from "@/lib/customer-session-context";
import { StoreBrandingProvider } from "@/lib/store-branding-context";
import { isAdminPath } from "@/lib/admin-routes";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import { StaffMobileAuthBridge } from "@/components/staff-mobile-auth-bridge";
import { StaffPushRegistration } from "@/components/staff-push-registration";
import { StaffOfflineBanner } from "@/components/staff-offline-banner";
import { StaffPwaPolicy } from "@/components/staff-pwa-policy";
import { shouldEvictShopServiceWorker } from "@/lib/staff-pwa";

import appCss from "../styles.css?url";
import { FALLBACK_DESCRIPTION, FALLBACK_SHOP_NAME, FALLBACK_TAGLINE } from "@/lib/store-branding";
import { PWA_THEME_COLOR } from "@/lib/pwa";
import { PwaRegistration } from "@/components/pwa-registration";
import { ClientErrorReporting } from "@/components/client-error-reporting";
import { captureClientError } from "@/lib/observability/client-errors";

function NotFoundComponent() {
  return (
    <ShopLayout>
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-heading text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-medium text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </ShopLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  captureClientError(error, { source: "router.errorComponent" });
  const router = useRouter();
  return (
    <ShopLayout>
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          This page didn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </ShopLayout>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${FALLBACK_SHOP_NAME} — ${FALLBACK_TAGLINE}` },
      {
        name: "description",
        content: FALLBACK_DESCRIPTION,
      },
      { name: "author", content: FALLBACK_SHOP_NAME },
      { name: "robots", content: "index, follow" },
      { name: "theme-color", content: PWA_THEME_COLOR },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/pwa-icon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isAdmin = useRouterState({ select: (s) => isAdminPath(s.location.pathname) });
  const showStaffMobileAuth = isAdmin || isNativeStaffApp();
  const showStaffPwaPolicy = shouldEvictShopServiceWorker();

  const outlet = (
    <>
      {showStaffPwaPolicy ? <StaffPwaPolicy /> : null}
      {showStaffMobileAuth ? <StaffMobileAuthBridge /> : null}
      {showStaffMobileAuth ? <StaffPushRegistration /> : null}
      {isAdmin ? <StaffOfflineBanner /> : null}
      <Outlet />
      <ClientErrorReporting />
      <Toaster richColors position="top-right" />
    </>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StoreBrandingProvider>
        <AuthProvider>
          {isAdmin ? (
            outlet
          ) : (
            <CustomerSessionProvider>
              {outlet}
              <PwaRegistration />
            </CustomerSessionProvider>
          )}
        </AuthProvider>
      </StoreBrandingProvider>
    </QueryClientProvider>
  );
}

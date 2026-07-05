import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/lib/auth";
import { StoreBrandingProvider } from "@/lib/store-branding-context";
import { PWA_THEME_COLOR } from "@/lib/pwa";
import { ClientErrorReporting } from "@/components/client-error-reporting";
import { StaffMobileAuthBridge } from "@/components/staff-mobile-auth-bridge";
import { StaffInviteResumeBridge } from "@/components/staff-invite-resume-bridge";
import { StaffPushRegistration } from "@/components/staff-push-registration";
import { StaffOfflineBanner } from "@/components/staff-offline-banner";
import { StaffPwaPolicy } from "@/components/staff-pwa-policy";
import { StaffAppUpdatePrompt } from "@/components/staff-app-update-prompt";
import { captureClientError } from "@/lib/observability/client-errors";
import { ADMIN_PWA_ICON } from "@/lib/staff-pwa";

import appCss from "@/styles.css?url";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-heading text-7xl font-semibold text-foreground">404</h1>
      <h2 className="mt-4 text-xl font-medium text-foreground">Page not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This staff page doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  captureClientError(error, { source: "router.errorComponent" });
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
        This page didn&apos;t load
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong on our end. Try refreshing or return to the dashboard.
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
          <Link to="/">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Kate Admin" },
      {
        name: "description",
        content: "Kate shop staff console — orders, catalog, and store operations.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: PWA_THEME_COLOR },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: ADMIN_PWA_ICON, type: "image/svg+xml" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: ADMIN_PWA_ICON },
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

  return (
    <QueryClientProvider client={queryClient}>
      <StoreBrandingProvider>
        <AuthProvider>
          <StaffPwaPolicy />
          <StaffMobileAuthBridge />
          <StaffInviteResumeBridge />
          <StaffPushRegistration />
          <StaffOfflineBanner />
          <StaffAppUpdatePrompt />
          <Outlet />
          <ClientErrorReporting />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </StoreBrandingProvider>
    </QueryClientProvider>
  );
}

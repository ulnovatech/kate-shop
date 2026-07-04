import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStoreBranding } from "@/lib/store-branding-context";
import { useCustomerSession } from "@/lib/customer-session-context";
import { useStorefrontChrome } from "@/lib/storefront-chrome-context";
import {
  captureInstallPrompt,
  dismissPwaInstallOffer,
  isIosDevice,
  isPwaInstallBlockedPath,
  recordPwaStorefrontVisit,
  shouldOfferPwaInstall,
  triggerInstallPrompt,
} from "@/lib/pwa-install";
import { isStaffWebHost } from "@/lib/staff-pwa";
import { cn } from "@/lib/utils";

export function PwaInstallPrompt() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hostname = typeof window !== "undefined" ? window.location.hostname : undefined;
  const blocked = isPwaInstallBlockedPath(pathname, hostname);
  const { shopName } = useStoreBranding();
  const { session } = useCustomerSession();
  const { showTabBar } = useStorefrontChrome();
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);

  useEffect(() => {
    if (blocked || isStaffWebHost(hostname)) return () => {};
    return captureInstallPrompt(() => setHasDeferredPrompt(true));
  }, [blocked, hostname]);

  useEffect(() => {
    if (blocked) return;
    setVisitCount(recordPwaStorefrontVisit());
  }, [blocked, pathname]);

  useEffect(() => {
    setVisible(
      shouldOfferPwaInstall({
        isProd: import.meta.env.PROD,
        pathname,
        hostname,
        visitCount,
        hasCustomerSession: Boolean(session?.customerId),
        hasDeferredPrompt,
        isIos: isIosDevice(),
      }),
    );
  }, [pathname, hostname, visitCount, session?.customerId, hasDeferredPrompt]);

  const handleDismiss = () => {
    dismissPwaInstallOffer();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIosDevice()) {
      setIosSheetOpen(true);
      return;
    }

    const outcome = await triggerInstallPrompt();
    if (outcome === "accepted") {
      setVisible(false);
      return;
    }
    if (outcome === "dismissed") {
      dismissPwaInstallOffer();
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Install app"
        className={cn(
          "fixed inset-x-0 z-[38] border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur",
          showTabBar
            ? "bottom-[calc(var(--storefront-tab-height)+env(safe-area-inset-bottom))]"
            : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Download className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Install {shopName} for quick access
              </p>
              <p className="text-xs text-muted-foreground">
                {isIosDevice()
                  ? "Add to your home screen — opens like an app."
                  : "One tap to add — shop faster next time."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" onClick={handleDismiss}>
              Not now
            </Button>
            <Button type="button" size="sm" onClick={() => void handleInstall()}>
              {isIosDevice() ? "How to" : "Install"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={iosSheetOpen} onOpenChange={setIosSheetOpen}>
        <IosInstallSheet shopName={shopName} />
      </Sheet>
    </>
  );
}

function IosInstallSheet({ shopName }: { shopName: string }) {
  return (
    <SheetContent side="bottom" className="rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
      <SheetHeader className="text-left">
        <SheetTitle>Add {shopName} to your home screen</SheetTitle>
        <SheetDescription>
          Safari doesn&apos;t show an install button — use Share, then Add to Home Screen.
        </SheetDescription>
      </SheetHeader>
      <ol className="mt-6 space-y-4 text-sm text-foreground">
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            1
          </span>
          <span>
            Tap <Share className="mx-0.5 inline h-4 w-4 align-text-bottom" aria-hidden />{" "}
            <strong>Share</strong> in the Safari toolbar (bottom on iPhone).
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            2
          </span>
          <span>
            Scroll and tap <strong>Add to Home Screen</strong>.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            3
          </span>
          <span>
            Tap <strong>Add</strong> — {shopName} will open full screen from your home screen.
          </span>
        </li>
      </ol>
    </SheetContent>
  );
}

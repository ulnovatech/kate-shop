import { useCallback, useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { isNewerAdminMobileRelease } from "@kate/domain/admin-mobile-release";
import { getAdminMobileAndroidRelease } from "@/lib/api/admin-mobile-release.functions";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";
import {
  dismissUpdateForVersion,
  installAdminMobileUpdate,
  readDismissedUpdateCode,
} from "@/lib/admin-mobile-updater";
import { humanizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminMobileAndroidRelease } from "@kate/domain/admin-mobile-release";

/**
 * Native Kate Admin APK — checks published release manifest and offers in-app update.
 * Web/PWA users never see this (they always load the latest admin deploy).
 */
export function StaffAppUpdatePrompt() {
  const [installedCode, setInstalledCode] = useState<number | null>(null);
  const [release, setRelease] = useState<AdminMobileAndroidRelease | null>(null);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const evaluate = useCallback(async () => {
    if (!isNativeStaffApp()) return;

    try {
      const info = await App.getInfo();
      const build = Number.parseInt(info.build, 10);
      if (!Number.isFinite(build)) return;
      setInstalledCode(build);

      const { release: latest } = await getAdminMobileAndroidRelease();
      if (!latest || !isNewerAdminMobileRelease(build, latest)) return;
      if (readDismissedUpdateCode() >= latest.versionCode) return;

      setRelease(latest);
      setOpen(true);
    } catch (error) {
      console.warn("[staff-app-update] check failed:", error);
    }
  }, []);

  useEffect(() => {
    void evaluate();

    if (!isNativeStaffApp()) return;

    let removeHandle: (() => void) | undefined;
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void evaluate();
    }).then((handle) => {
      removeHandle = () => void handle.remove();
    });

    return () => removeHandle?.();
  }, [evaluate]);

  const handleLater = () => {
    if (release) dismissUpdateForVersion(release.versionCode);
    setOpen(false);
  };

  const handleUpdate = async () => {
    if (!release) return;
    setUpdating(true);
    try {
      await installAdminMobileUpdate(release.apkUrl);
      toast.message("Follow Android’s install prompt to finish updating.");
      setOpen(false);
    } catch (error) {
      toast.error(humanizeError(error, { fallback: "Could not start the update." }));
    } finally {
      setUpdating(false);
    }
  };

  if (!isNativeStaffApp() || !release || installedCode === null) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleLater()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <div className="bg-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Smartphone className="size-5" aria-hidden />
            </div>
            <div>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle>Update available</DialogTitle>
                <DialogDescription>
                  Kate Admin {release.versionName} is ready. You&apos;re on build {installedCode}.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {release.releaseNotes ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{release.releaseNotes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tap update to download and install the latest app shell. Your sign-in and data stay
              on the server.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Android will ask you to confirm the install. Allow &quot;Install unknown apps&quot; for
            Kate Admin if prompted.
          </p>
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleLater} disabled={updating}>
            Later
          </Button>
          <Button type="button" onClick={() => void handleUpdate()} disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Downloading…
              </>
            ) : (
              "Update now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

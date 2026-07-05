import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, Loader2, Smartphone } from "lucide-react";
import { buildStaffInviteDeepLink } from "@kate/domain/staff-invite-links";
import { getAdminMobileAndroidRelease } from "@/lib/api/admin-mobile-release.functions";
import { savePendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { Button } from "@/components/ui/button";
import { adminPrimaryTouch } from "@/lib/admin-mobile";

type StaffInviteMobileGateProps = {
  token: string;
  inviteEmail: string;
  inviteRole: string | null;
  onContinueInBrowser: () => void;
};

export function StaffInviteMobileGate({
  token,
  inviteEmail,
  inviteRole,
  onContinueInBrowser,
}: StaffInviteMobileGateProps) {
  const [installStarted, setInstallStarted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-mobile-release-public"],
    queryFn: () => getAdminMobileAndroidRelease(),
  });

  const apkUrl = data?.release?.apkUrl ?? null;

  useEffect(() => {
    if (!isLoading && !apkUrl) onContinueInBrowser();
  }, [isLoading, apkUrl, onContinueInBrowser]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        Preparing your invite…
      </div>
    );
  }

  if (!apkUrl) {
    return null;
  }

  const startInstall = () => {
    savePendingStaffInviteToken(token);
    setInstallStarted(true);
    window.location.assign(apkUrl);
  };

  const openInApp = () => {
    savePendingStaffInviteToken(token);
    window.location.href = buildStaffInviteDeepLink(token);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-elevated">
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Smartphone className="size-7" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Staff invite
              </p>
              <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
                Join Kate Admin
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{inviteEmail}</span>
                {inviteRole ? (
                  <>
                    {" "}
                    · <span className="capitalize">{inviteRole}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          {!installStarted ? (
            <>
              <p className="text-sm text-muted-foreground">
                One link does it all: install the staff app, then finish signup inside Kate Admin.
              </p>
              <Button
                type="button"
                className={`w-full ${adminPrimaryTouch}`}
                onClick={startInstall}
              >
                <Download className="size-4" aria-hidden />
                Install app &amp; continue
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Android will ask you to confirm the install. Your invite stays saved.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                After install finishes, open Kate Admin — your invite will continue automatically.
              </p>
              <Button type="button" className={`w-full ${adminPrimaryTouch}`} onClick={openInApp}>
                <ExternalLink className="size-4" aria-hidden />
                Open Kate Admin
              </Button>
              <p className="text-xs text-muted-foreground">
                Can&apos;t see the app yet? Find <strong>Kate Admin</strong> on your home screen, or
                tap the button above.
              </p>
            </>
          )}

          <Button type="button" variant="ghost" className="w-full" onClick={onContinueInBrowser}>
            Continue in browser instead
          </Button>
        </div>
      </div>
    </div>
  );
}

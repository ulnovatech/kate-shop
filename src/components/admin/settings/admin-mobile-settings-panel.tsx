import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getAdminMobileReleaseForStaff } from "@/lib/api/admin-mobile-release.functions";
import { Button } from "@/components/ui/button";
import { AdminMobileReleasePublisher } from "@/components/admin/settings/admin-mobile-release-publisher";

export function AdminMobileSettingsPanel() {
  const { isOwner } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-mobile-release"],
    queryFn: () => getAdminMobileReleaseForStaff(),
  });

  const release = data?.release ?? null;
  const installUrl = data?.installUrl ?? null;

  const copyInstallLink = async () => {
    if (!installUrl) return;
    try {
      await navigator.clipboard.writeText(installUrl);
      toast.success("Install link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <div className="space-y-stack">
      {isOwner ? <AdminMobileReleasePublisher /> : null}

      <section className="space-y-stack rounded-lg border bg-card p-card shadow-elevated">
        <div>
          <h2 className="type-h3">Staff install link</h2>
          <p className="mt-1 type-body-sm text-muted-foreground">
            Share with new team members. Uses a short link that works in WhatsApp. Existing staff
            get updates inside the app after you publish.
          </p>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading release info…
          </div>
        ) : isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">Could not load mobile release info.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : release ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Smartphone className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-foreground">Published release</p>
                <p className="text-sm text-muted-foreground">
                  Version {release.versionName} (build {release.versionCode}) ·{" "}
                  {new Date(release.publishedAt).toLocaleString()}
                </p>
                {release.releaseNotes ? (
                  <p className="whitespace-pre-wrap pt-2 text-sm text-foreground">
                    {release.releaseNotes}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" onClick={() => void copyInstallLink()}>
                <Copy className="size-4" aria-hidden />
                Copy install link
              </Button>
              {installUrl ? (
                <Button type="button" variant="outline" asChild>
                  <a href={installUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" aria-hidden />
                    Open APK
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No release published yet.
            {isOwner
              ? " Use Publish update to staff above when native app changes are ready."
              : " Ask an owner to publish the first release."}
          </div>
        )}
      </section>
    </div>
  );
}

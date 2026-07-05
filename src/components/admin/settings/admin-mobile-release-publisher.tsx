import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Rocket,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  dismissAdminMobileReleaseJob,
  getAdminMobileReleasePublishPanel,
  publishAdminMobileRelease,
  refreshAdminMobileReleaseJob,
} from "@/lib/api/admin-mobile-release.functions";
import { humanizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { adminPrimaryTouch } from "@/lib/admin-mobile";

const PANEL_QUERY_KEY = ["admin-mobile-release-panel"];

export function AdminMobileReleasePublisher() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: PANEL_QUERY_KEY,
    queryFn: () => getAdminMobileReleasePublishPanel(),
  });

  const [versionName, setVersionName] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [buildVariant, setBuildVariant] = useState<"release" | "debug">("release");
  const [workflowUrl, setWorkflowUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.suggestedVersionName || versionName) return;
    setVersionName(data.suggestedVersionName);
  }, [data?.suggestedVersionName, versionName]);

  const job = data?.job ?? null;
  const isBusy = job?.status === "queued" || job?.status === "building";

  useEffect(() => {
    if (!isBusy) return;
    const timer = window.setInterval(() => {
      void qc.invalidateQueries({ queryKey: PANEL_QUERY_KEY });
      void refreshAdminMobileReleaseJob().then((result) => {
        if (result.workflowUrl) setWorkflowUrl(result.workflowUrl);
        void qc.invalidateQueries({ queryKey: ["admin-mobile-release"] });
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [isBusy, qc]);

  const publishMutation = useMutation({
    mutationFn: () =>
      publishAdminMobileRelease({
        data: { versionName, releaseNotes, buildVariant },
      }),
    onSuccess: (result) => {
      setWorkflowUrl(result.workflowUrl);
      toast.success("Release started — building the new APK.");
      void qc.invalidateQueries({ queryKey: PANEL_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: ["admin-mobile-release"] });
      void refreshAdminMobileReleaseJob().then((refresh) => {
        if (refresh.workflowUrl) setWorkflowUrl(refresh.workflowUrl);
        void qc.invalidateQueries({ queryKey: PANEL_QUERY_KEY });
      });
    },
    onError: (error) => {
      toast.error(humanizeError(error, { fallback: "Could not start the release." }));
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => dismissAdminMobileReleaseJob(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PANEL_QUERY_KEY });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading publish tools…
      </div>
    );
  }

  if (!data?.publishConfigured) {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-5">
        <p className="font-medium text-foreground">One-click publish not wired yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a GitHub token to the admin Worker so this button can trigger{" "}
          <code className="text-xs">Release Kate Admin APK</code> for you.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            GitHub → Settings → Developer settings → Personal access tokens → fine-grained token
            with <strong>Actions: Read and write</strong> on this repo.
          </li>
          <li>
            GitHub repo → Settings → Environments → <strong>production</strong> → Secret{" "}
            <code className="text-xs">KATE_GH_RELEASE_TOKEN</code>.
          </li>
          <li>Redeploy admin (push to main). Reload this page.</li>
        </ol>
      </div>
    );
  }

  if (job?.status === "published") {
    return (
      <div className="overflow-hidden rounded-xl border bg-card shadow-elevated">
        <div className="bg-emerald-500/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">Update published</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Kate Admin {job.versionName} is live. Installed apps will prompt staff to update on
                next open.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void dismissMutation.mutate()}
            disabled={dismissMutation.isPending}
          >
            Publish another update
          </Button>
        </div>
      </div>
    );
  }

  if (job?.status === "failed") {
    return (
      <div className="overflow-hidden rounded-xl border border-destructive/30 bg-card shadow-elevated">
        <div className="bg-destructive/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">Release failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.errorMessage ?? "Check the GitHub workflow log for details."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {workflowUrl ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={workflowUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                View log
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void dismissMutation.mutate()}
            disabled={dismissMutation.isPending}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (isBusy) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card shadow-elevated">
        <div className="bg-primary/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Building Kate Admin {job?.versionName ?? versionName}…
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {job?.status === "queued"
                  ? "Waiting for a GitHub runner…"
                  : "Compiling APK and uploading to staff install link. Usually 3–6 minutes."}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4">
          {job?.releaseNotes ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.releaseNotes}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {workflowUrl ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={workflowUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Watch on GitHub
                </a>
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
              Refresh status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canPublish =
    /^\d+\.\d+\.\d+$/.test(versionName.trim()) && releaseNotes.trim().length >= 3;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-elevated">
      <div className="border-b bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Rocket className="size-6" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-foreground">Push update to staff</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Builds a new APK, publishes the install link, and prompts installed apps to update.
              Web-only changes do not need this.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="mobile-release-version">Version</Label>
            <Input
              id="mobile-release-version"
              value={versionName}
              onChange={(event) => setVersionName(event.target.value)}
              placeholder="1.0.1"
              className="mt-1.5"
              inputMode="decimal"
            />
            {data?.release ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Current published: {data.release.versionName}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">First release for staff devices</p>
            )}
          </div>
          <div>
            <Label htmlFor="mobile-release-variant">Build type</Label>
            <Select
              value={buildVariant}
              onValueChange={(value) => setBuildVariant(value as "release" | "debug")}
            >
              <SelectTrigger id="mobile-release-variant" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="release">Release (staff devices)</SelectItem>
                <SelectItem value="debug">Debug (testing only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="mobile-release-notes">What&apos;s new for staff</Label>
          <Textarea
            id="mobile-release-notes"
            rows={3}
            value={releaseNotes}
            onChange={(event) => setReleaseNotes(event.target.value)}
            placeholder="e.g. Faster order alerts, improved login, bug fixes…"
            className="mt-1.5 resize-none"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Shown in the in-app &quot;Update available&quot; dialog on staff phones.
          </p>
        </div>

        <Button
          type="button"
          className={cn("w-full sm:w-auto", adminPrimaryTouch)}
          disabled={!canPublish || publishMutation.isPending}
          onClick={() => void publishMutation.mutate()}
        >
          {publishMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Starting release…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden />
              Publish update to staff
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

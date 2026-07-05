/** Tracks an in-flight GitHub Actions mobile release job. */
export const ADMIN_MOBILE_RELEASE_JOB_CONFIG_KEY = "admin_mobile_release_job";

export type AdminMobileReleaseJobStatus = "idle" | "queued" | "building" | "published" | "failed";

export type AdminMobileReleaseJob = {
  workflowRunId: number;
  versionName: string;
  releaseNotes: string;
  buildVariant: "release" | "debug";
  triggeredAt: string;
  triggeredByUserId: string;
  status: AdminMobileReleaseJobStatus;
  conclusion?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export function suggestNextAdminMobileVersionName(current: string | null | undefined): string {
  if (!current?.trim()) return "1.0.0";
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current.trim());
  if (!match) return "1.0.0";
  const patch = Number.parseInt(match[3], 10);
  return `${match[1]}.${match[2]}.${Number.isFinite(patch) ? patch + 1 : 1}`;
}

export function parseAdminMobileReleaseJob(value: unknown): AdminMobileReleaseJob | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const workflowRunId = Number(row.workflowRunId);
  const versionName = typeof row.versionName === "string" ? row.versionName.trim() : "";
  const releaseNotes = typeof row.releaseNotes === "string" ? row.releaseNotes : "";
  const buildVariant = row.buildVariant === "debug" ? "debug" : "release";
  const triggeredAt = typeof row.triggeredAt === "string" ? row.triggeredAt : "";
  const triggeredByUserId = typeof row.triggeredByUserId === "string" ? row.triggeredByUserId : "";
  const status = row.status;
  const validStatuses = ["idle", "queued", "building", "published", "failed"] as const;
  if (
    !Number.isFinite(workflowRunId) ||
    workflowRunId < 1 ||
    !versionName ||
    !triggeredAt ||
    !triggeredByUserId ||
    !validStatuses.includes(status as AdminMobileReleaseJobStatus)
  ) {
    return null;
  }

  return {
    workflowRunId,
    versionName,
    releaseNotes,
    buildVariant,
    triggeredAt,
    triggeredByUserId,
    status: status as AdminMobileReleaseJobStatus,
    conclusion: typeof row.conclusion === "string" ? row.conclusion : null,
    completedAt: typeof row.completedAt === "string" ? row.completedAt : null,
    errorMessage: typeof row.errorMessage === "string" ? row.errorMessage : null,
  };
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerAuth, requireStaffAuth } from "@kate/api/auth-middleware.server";
import {
  clearAdminMobileReleaseJob,
  readAdminMobileAndroidRelease,
  readAdminMobileReleaseJob,
  writeAdminMobileReleaseJob,
} from "@kate/api/admin-mobile-release.server";
import {
  dispatchAdminMobileReleaseWorkflow,
  findAdminMobileReleaseRunAfter,
  getAdminMobileReleaseWorkflowRun,
  isAdminMobileReleasePublishConfigured,
  mapGithubRunToJobStatus,
} from "@kate/api/admin-mobile-release-github.server";
import { suggestNextAdminMobileVersionName } from "@kate/domain/admin-mobile-release-job";
import { writeAuditLog } from "@kate/api/audit.server";

/** Public release manifest for in-app update checks (no auth). */
export const getAdminMobileAndroidRelease = createServerFn({ method: "GET" }).handler(async () => {
  const release = await readAdminMobileAndroidRelease();
  return { release };
});

/** Staff-only — includes install URL for sharing with new team members. */
export const getAdminMobileReleaseForStaff = createServerFn({ method: "GET" })
  .middleware([requireStaffAuth])
  .handler(async () => {
    const release = await readAdminMobileAndroidRelease();
    const job = await readAdminMobileReleaseJob();
    return {
      release,
      installUrl: release?.apkUrl ?? null,
      activeJob: job && job.status !== "published" && job.status !== "idle" ? job : null,
    };
  });

/** Owner — publish UI state (config, suggested version, in-flight job). */
export const getAdminMobileReleasePublishPanel = createServerFn({ method: "GET" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    const release = await readAdminMobileAndroidRelease();
    const job = await readAdminMobileReleaseJob();
    return {
      publishConfigured: isAdminMobileReleasePublishConfigured(),
      release,
      installUrl: release?.apkUrl ?? null,
      suggestedVersionName: suggestNextAdminMobileVersionName(release?.versionName),
      job,
    };
  });

const publishSchema = z.object({
  versionName: z
    .string()
    .trim()
    .regex(/^\d+\.\d+\.\d+$/, "Use semver like 1.0.1"),
  releaseNotes: z.string().trim().min(3, "Add a short note for staff.").max(2000),
  buildVariant: z.enum(["release", "debug"]).default("release"),
});

/** Owner — one-click trigger of GitHub Release Kate Admin APK workflow. */
export const publishAdminMobileRelease = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .inputValidator(publishSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };
    const existingJob = await readAdminMobileReleaseJob();
    if (
      existingJob &&
      (existingJob.status === "queued" || existingJob.status === "building")
    ) {
      throw new Error("A release is already in progress. Wait for it to finish.");
    }

    const triggeredAt = new Date().toISOString();
    await dispatchAdminMobileReleaseWorkflow({
      releaseNotes: data.releaseNotes,
      versionName: data.versionName,
      buildVariant: data.buildVariant,
    });

    let run = await findAdminMobileReleaseRunAfter(triggeredAt);
    if (!run) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      run = await findAdminMobileReleaseRunAfter(triggeredAt);
    }

    const job = {
      workflowRunId: run?.id ?? 0,
      versionName: data.versionName,
      releaseNotes: data.releaseNotes,
      buildVariant: data.buildVariant,
      triggeredAt,
      triggeredByUserId: auth.userId,
      status: "queued" as const,
      conclusion: null,
      completedAt: null,
      errorMessage: run ? null : "Workflow started — refresh status in a moment.",
    };

    await writeAdminMobileReleaseJob(job);

    await writeAuditLog({
      actorId: auth.userId,
      action: "other",
      entityType: "admin_mobile_release",
      entityId: String(run?.id ?? "pending"),
      payload: {
        event: "release_triggered",
        versionName: data.versionName,
        buildVariant: data.buildVariant,
      },
    });

    return {
      job,
      workflowUrl: run?.html_url ?? null,
    };
  });

/** Owner — poll GitHub run + sync manifest when complete. */
export const refreshAdminMobileReleaseJob = createServerFn({ method: "GET" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    const job = await readAdminMobileReleaseJob();
    if (!job) {
      return { job: null as null, release: await readAdminMobileAndroidRelease() };
    }

    if (job.status === "published" || job.status === "failed") {
      return { job, release: await readAdminMobileAndroidRelease() };
    }

    let run =
      job.workflowRunId > 0
        ? await getAdminMobileReleaseWorkflowRun(job.workflowRunId)
        : await findAdminMobileReleaseRunAfter(job.triggeredAt);

    if (!run) {
      return { job, release: await readAdminMobileAndroidRelease() };
    }

    const mapped = mapGithubRunToJobStatus(run);
    const release = await readAdminMobileAndroidRelease();
    const manifestMatches =
      mapped === "published" &&
      release &&
      release.versionName === job.versionName &&
      release.publishedAt >= job.triggeredAt;

    const nextJob = {
      ...job,
      workflowRunId: run.id,
      status: manifestMatches ? ("published" as const) : mapped,
      conclusion: run.conclusion,
      completedAt:
        run.status === "completed" ? run.updated_at : (job.completedAt ?? null),
      errorMessage:
        mapped === "failed"
          ? `GitHub workflow ${run.conclusion ?? "failed"}. Open the run log for details.`
          : null,
    };

    await writeAdminMobileReleaseJob(nextJob);

    return {
      job: nextJob,
      release,
      workflowUrl: run.html_url,
    };
  });

/** Owner — dismiss completed/failed job banner. */
export const dismissAdminMobileReleaseJob = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    await clearAdminMobileReleaseJob();
    return { ok: true as const };
  });

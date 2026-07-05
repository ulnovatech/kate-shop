/**
 * Trigger and poll Kate Admin APK release via GitHub Actions workflow_dispatch.
 */
const WORKFLOW_FILE = "release-admin-apk.yml";
const DEFAULT_REPO = "ulnovatech/kate-shop";

export type GitHubWorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
};

function resolveGithubRepo(): string {
  return process.env.GITHUB_REPO?.trim() || DEFAULT_REPO;
}

function parseGithubErrorBody(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message?.trim()) return parsed.message.trim();
  } catch {
    // use raw body
  }
  return body.trim().slice(0, 240) || "Unknown GitHub error";
}

/** User-facing message — avoid "forbidden"/"permission" so RBAC humanizer does not mislabel it. */
export function formatGithubReleaseError(status: number, body: string): string {
  const detail = parseGithubErrorBody(body);
  const repo = resolveGithubRepo();

  if (status === 401 || status === 403) {
    return `GitHub release token was rejected (${status}). Set KATE_GH_RELEASE_TOKEN on the admin Worker with Actions read and write access to ${repo}, then redeploy. GitHub: ${detail}`;
  }

  return `GitHub release trigger failed (${status}): ${detail}`;
}

export async function verifyAdminMobileReleaseGithubAccess(): Promise<{
  ok: boolean;
  error: string | null;
}> {
  if (!isAdminMobileReleasePublishConfigured()) {
    return { ok: false, error: null };
  }

  try {
    await listRecentAdminMobileReleaseRuns(1);
    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "GitHub release token check failed.",
    };
  }
}

function resolveGithubToken(): string | null {
  return (
    process.env.KATE_GH_RELEASE_TOKEN?.trim() ||
    process.env.GITHUB_RELEASE_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    null
  );
}

export function isAdminMobileReleasePublishConfigured(): boolean {
  return Boolean(resolveGithubToken());
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = resolveGithubToken();
  if (!token) {
    throw new Error(
      "Mobile release publishing is not configured. Add KATE_GH_RELEASE_TOKEN to GitHub production secrets and redeploy admin.",
    );
  }

  const repo = resolveGithubRepo();
  const url = `https://api.github.com/repos/${repo}${path}`;

  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

export async function dispatchAdminMobileReleaseWorkflow(input: {
  releaseNotes: string;
  versionName: string;
  buildVariant: "release" | "debug";
}): Promise<void> {
  const res = await githubFetch(`/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        release_notes: input.releaseNotes,
        version_name: input.versionName,
        build_variant: input.buildVariant,
      },
    }),
  });

  if (res.status === 204) return;

  const body = await res.text();
  if (res.status === 404) {
    throw new Error(
      "Release workflow not found on GitHub. Push release-admin-apk.yml to main and try again.",
    );
  }
  throw new Error(formatGithubReleaseError(res.status, body));
}

export async function listRecentAdminMobileReleaseRuns(limit = 5): Promise<GitHubWorkflowRun[]> {
  const res = await githubFetch(
    `/actions/workflows/${WORKFLOW_FILE}/runs?branch=main&per_page=${limit}`,
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(formatGithubReleaseError(res.status, body));
  }

  const json = (await res.json()) as { workflow_runs?: GitHubWorkflowRun[] };
  return json.workflow_runs ?? [];
}

export async function getAdminMobileReleaseWorkflowRun(
  runId: number,
): Promise<GitHubWorkflowRun | null> {
  const res = await githubFetch(`/actions/runs/${runId}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Could not fetch workflow run (${res.status}): ${body.slice(0, 240)}`);
  }
  return (await res.json()) as GitHubWorkflowRun;
}

export async function findAdminMobileReleaseRunAfter(
  triggeredAtIso: string,
): Promise<GitHubWorkflowRun | null> {
  const triggeredAt = Date.parse(triggeredAtIso);
  const runs = await listRecentAdminMobileReleaseRuns(8);
  const match = runs.find((run) => Date.parse(run.created_at) >= triggeredAt - 15_000);
  return match ?? null;
}

export function mapGithubRunToJobStatus(
  run: GitHubWorkflowRun,
): "queued" | "building" | "published" | "failed" {
  if (run.status === "queued" || run.status === "waiting" || run.status === "requested") {
    return "queued";
  }
  if (run.status === "in_progress" || run.status === "pending") {
    return "building";
  }
  if (run.status === "completed") {
    return run.conclusion === "success" ? "published" : "failed";
  }
  return "building";
}

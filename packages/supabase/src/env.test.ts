import { afterEach, describe, expect, it, vi } from "vitest";

describe("getSupabasePublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefers runtime process.env over empty build-time Vite placeholders", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_URL", "https://runtime.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "runtime-key");
    vi.stubEnv("VITE_SUPABASE_PROJECT_ID", "");

    const { getSupabasePublicConfig } = await import("./env");
    expect(getSupabasePublicConfig()).toEqual({
      url: "https://runtime.supabase.co",
      publishableKey: "runtime-key",
      projectId: undefined,
    });
  });
});

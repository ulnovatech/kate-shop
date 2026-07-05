import {
  ADMIN_MOBILE_RELEASE_CONFIG_KEY,
  parseAdminMobileRelease,
  type AdminMobileAndroidRelease,
} from "@kate/domain/admin-mobile-release";
import {
  ADMIN_MOBILE_RELEASE_JOB_CONFIG_KEY,
  parseAdminMobileReleaseJob,
  type AdminMobileReleaseJob,
} from "@kate/domain/admin-mobile-release-job";
import { supabaseAdmin } from "@kate/supabase/client.server";

export async function readAdminMobileAndroidRelease(): Promise<AdminMobileAndroidRelease | null> {
  const { data, error } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", ADMIN_MOBILE_RELEASE_CONFIG_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.value) return null;
  return parseAdminMobileRelease(data.value);
}

export async function writeAdminMobileAndroidRelease(
  release: AdminMobileAndroidRelease,
): Promise<void> {
  const { error } = await supabaseAdmin.from("system_config").upsert({
    key: ADMIN_MOBILE_RELEASE_CONFIG_KEY,
    value: release,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function readAdminMobileReleaseJob(): Promise<AdminMobileReleaseJob | null> {
  const { data, error } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", ADMIN_MOBILE_RELEASE_JOB_CONFIG_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.value) return null;
  return parseAdminMobileReleaseJob(data.value);
}

export async function writeAdminMobileReleaseJob(job: AdminMobileReleaseJob): Promise<void> {
  const { error } = await supabaseAdmin.from("system_config").upsert({
    key: ADMIN_MOBILE_RELEASE_JOB_CONFIG_KEY,
    value: job,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function clearAdminMobileReleaseJob(): Promise<void> {
  const { error } = await supabaseAdmin
    .from("system_config")
    .delete()
    .eq("key", ADMIN_MOBILE_RELEASE_JOB_CONFIG_KEY);

  if (error) throw new Error(error.message);
}

import type { NavigateOptions } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signInWithStaffPin } from "@/lib/api/auth.functions";
import { STAFF_ROLES, type StaffRole } from "@/lib/db/contracts";
import { defaultAdminPath, pickPrimaryRole } from "@/lib/rbac";
import { markStaffAppUnlocked } from "@/lib/staff-screen-lock";

type NavigateFn = (options: NavigateOptions) => void;

/** After Supabase session is established, ensure the user has staff access and navigate in. */
export async function finishStaffSignIn(navigate: NavigateFn): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    toast.success("Welcome back");
    markStaffAppUnlocked();
    navigate({ to: "/admin" });
    return true;
  }

  const { data: rows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.user.id)
    .in("role", [...STAFF_ROLES]);

  const role = pickPrimaryRole((rows ?? []).map((r) => r.role as StaffRole));
  if (!role) {
    await supabase.auth.signOut();
    toast.error(
      "This account does not have staff access. Use an invite link from the shop owner.",
    );
    return false;
  }

  toast.success("Welcome back");
  markStaffAppUnlocked();
  navigate({ to: defaultAdminPath(role) });
  return true;
}

/** Verify PIN and create a Supabase session without navigating. */
export async function establishStaffPinSession(email: string, pin: string): Promise<void> {
  const { hashed_token } = await signInWithStaffPin({
    data: { email: email.trim(), pin },
  });
  const { error } = await supabase.auth.verifyOtp({
    token_hash: hashed_token,
    type: "magiclink",
  });
  if (error) throw error;
  markStaffAppUnlocked();
}

/** Establish a staff session using email + PIN and navigate in. */
export async function signInWithStaffPinAndFinish(
  email: string,
  pin: string,
  navigate: NavigateFn,
): Promise<boolean> {
  await establishStaffPinSession(email, pin);
  return finishStaffSignIn(navigate);
}

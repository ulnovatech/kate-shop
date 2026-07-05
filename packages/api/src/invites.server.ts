import { createHash } from "node:crypto";
import { supabaseAdmin } from "@kate/supabase/client.server";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type OpenAdminInvite = {
  id: string;
  email: string | null;
  role: string;
  role_id: string | null;
  expires_at: string;
  used_at: string | null;
};

export async function getOpenInviteByToken(token: string): Promise<OpenAdminInvite | null> {
  const { data: invite, error } = await supabaseAdmin
    .from("admin_invites")
    .select("id, email, role, role_id, expires_at, used_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!invite || invite.used_at) return null;
  if (new Date(invite.expires_at) < new Date()) return null;

  return invite;
}

export async function assertOpenInviteToken(token: string): Promise<OpenAdminInvite> {
  const invite = await getOpenInviteByToken(token);
  if (!invite) {
    throw new Error("Invite is invalid, expired, or already used.");
  }
  return invite;
}

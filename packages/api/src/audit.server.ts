import { supabaseAdmin } from "@kate/supabase/client.server";
import {
  buildAuditPayload,
  type AuditAction,
  type AuditEntityType,
  type AuditPayload,
} from "@/lib/audit";

export type WriteAuditInput = {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType | string;
  entityId?: string | null;
  payload?: AuditPayload;
  ipAddress?: string | null;
};

export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? {},
    ip_address: input.ipAddress ?? null,
  });

  if (error) {
    console.error("[audit] failed to write log:", error.message);
  }
}

export async function auditFromServer(
  actorId: string,
  action: AuditAction,
  entityType: AuditEntityType | string,
  entityId: string | null | undefined,
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  extra?: Record<string, unknown>,
): Promise<void> {
  await writeAuditLog({
    actorId,
    action,
    entityType,
    entityId,
    payload: buildAuditPayload(before, after, entityType as AuditEntityType, extra),
  });
}

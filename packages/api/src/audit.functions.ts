import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requirePermission, requireStaffAuth } from "@kate/api/auth-middleware.server";
import { writeAuditLog } from "@kate/api/audit.server";
import {
  AUDIT_ACTIONS,
  buildAuditPayload,
  isAuditVisibleToManager,
  type AuditEntityType,
  type AuditLogRow,
  type AuditPayload,
} from "@/lib/audit";

const recordSchema = z.object({
  action: z.enum(AUDIT_ACTIONS),
  entity_type: z.string().trim().min(1).max(64),
  entity_id: z.string().trim().max(128).optional(),
  before: z.record(z.string(), z.unknown()).nullable().optional(),
  after: z.record(z.string(), z.unknown()).nullable().optional(),
  note: z.string().max(500).optional(),
});

export const recordAudit = createServerFn({ method: "POST" })
  .middleware([requireStaffAuth])
  .inputValidator(recordSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string };
    const entityType = data.entity_type as AuditEntityType;
    const payload = buildAuditPayload(data.before, data.after, entityType, {
      note: data.note,
    });

    await writeAuditLog({
      actorId: auth.userId,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id ?? null,
      payload,
    });

    return { ok: true };
  });

const listSchema = z.object({
  query: z.string().trim().max(100).optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  entity_type: z.string().trim().max(64).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export type AuditLogListItem = AuditLogRow & {
  actor_email: string | null;
};

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requirePermission("audit", "view")])
  .inputValidator(listSchema)
  .handler(async ({ data, context }) => {
    const auth = context.auth as { userId: string; isOwner: boolean; staffRole: string };

    let q = supabaseAdmin
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, payload, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.action) q = q.eq("action", data.action);
    if (data.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data.date_from) q = q.gte("created_at", data.date_from);
    if (data.date_to) q = q.lte("created_at", `${data.date_to}T23:59:59.999Z`);

    const term = data.query?.trim();
    if (term) {
      q = q.or(
        [`entity_id.ilike.%${term}%`, `entity_type.ilike.%${term}%`, `action.ilike.%${term}%`].join(
          ",",
        ),
      );
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let items = (rows ?? []) as AuditLogRow[];

    if (!auth.isOwner) {
      items = items.filter(isAuditVisibleToManager);
    }

    const actorIds = [...new Set(items.map((r) => r.actor_id).filter(Boolean))] as string[];
    const emailById = new Map<string, string>();

    if (actorIds.length) {
      const results = await Promise.all(
        actorIds.map(async (id) => {
          const { data: user } = await supabaseAdmin.auth.admin.getUserById(id);
          return [id, user.user?.email ?? null] as const;
        }),
      );
      for (const [id, email] of results) {
        if (email) emailById.set(id, email);
      }
    }

    return items.map(
      (row): AuditLogListItem => ({
        ...row,
        payload: (row.payload ?? {}) as AuditPayload,
        actor_email: row.actor_id ? (emailById.get(row.actor_id) ?? null) : null,
      }),
    );
  });

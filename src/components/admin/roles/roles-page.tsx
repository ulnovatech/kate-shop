import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  getPermissionMatrixMeta,
  listRoles,
  saveCustomRole,
  type RoleRow,
} from "@/lib/api/roles.functions";
import type { PermissionKey } from "@/lib/permissions";
import { humanizeError } from "@/lib/errors";
import {
  ROLE_TEMPLATES,
  type RoleTemplate,
} from "@/lib/role-templates";
import { RoleTemplateBar } from "./role-template-bar";
import { RolesPermissionMatrix } from "./roles-permission-matrix";

const ROLES_KEY = ["admin-roles"];
const MATRIX_KEY = ["permission-matrix-meta"];

export function RolesPage() {
  const qc = useQueryClient();
  const { permissions } = useAuth();
  const canEdit = permissions.canManageRoles;

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => listRoles(),
  });

  const { data: matrixMeta } = useQuery({
    queryKey: MATRIX_KEY,
    queryFn: () => getPermissionMatrixMeta(),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keys, setKeys] = useState<Set<PermissionKey>>(new Set());
  const [creating, setCreating] = useState(false);

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) ?? null,
    [roles, selectedId],
  );

  const editable =
    selected &&
    canEdit &&
    !selected.is_locked &&
    (!selected.is_system || selected.slug === "admin");

  useEffect(() => {
    if (creating) {
      setName("");
      setDescription("");
      setKeys(new Set());
      return;
    }
    if (!selected) return;
    setName(selected.name);
    setDescription(selected.description);
    setKeys(new Set(selected.permission_keys));
  }, [selected, creating]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveCustomRole({
        data: {
          id: creating ? undefined : selected?.id,
          name: name.trim(),
          description: description.trim(),
          permission_keys: [...keys],
        },
      }),
    onSuccess: (result) => {
      toast.success(creating ? "Role created" : "Role saved");
      setCreating(false);
      setSelectedId(result.id);
      qc.invalidateQueries({ queryKey: ROLES_KEY });
      qc.invalidateQueries({ queryKey: ["invitable-roles"] });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not save role.", action: "manage roles" })),
  });

  const toggleKey = (key: PermissionKey, checked: boolean) => {
    setKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
  };

  const selectRole = (role: RoleRow) => {
    setCreating(false);
    setSelectedId(role.id);
  };

  const applyTemplate = (template: RoleTemplate, templateKeys: PermissionKey[]) => {
    if (!creating && !editable) return;
    setKeys(new Set(templateKeys));
    if (creating && !name.trim()) {
      setName(`${template.label} (custom)`);
      setDescription(template.description);
    }
  };

  const duplicateSystemRole = (role: RoleRow) => {
    setCreating(true);
    setSelectedId(null);
    setName(`${role.name} (copy)`);
    setDescription(role.description);
    setKeys(new Set(role.permission_keys));
  };

  const showEditor = creating || selected;
  const matrixDisabled = !creating && !editable;

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Roles & permissions"
        description="System roles define default access. Custom roles can be assigned when inviting team members."
        actions={
          canEdit ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              New custom role
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
            <Shield className="h-4 w-4 text-gold" /> Roles
          </div>
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y">
              {roles.map((role) => {
                const active = !creating && role.id === selectedId;
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      onClick={() => selectRole(role)}
                      className={`flex w-full flex-col items-start px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/60 ${
                        active ? "bg-secondary" : ""
                      }`}
                    >
                      <span className="font-medium">{role.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.is_system ? "System" : "Custom"}
                        {role.is_locked ? " · locked" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          {!showEditor ? (
            <p className="text-sm text-muted-foreground">Select a role to view permissions.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="role-name">Name</Label>
                  <Input
                    id="role-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={matrixDisabled}
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="role-desc">Description</Label>
                  <Textarea
                    id="role-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={matrixDisabled}
                    className="mt-1.5 min-h-[72px]"
                  />
                </div>
              </div>

              {creating && canEdit ? <RoleTemplateBar onApply={applyTemplate} /> : null}

              {selected?.is_system && !selected.is_locked && selected.slug !== "admin" && canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateSystemRole(selected)}
                  >
                    Duplicate as custom role
                  </Button>
                </div>
              ) : null}

              {matrixMeta ? (
                <div className="space-y-3">
                  <h2 className="font-heading text-lg font-semibold">Permission matrix</h2>
                  <RolesPermissionMatrix
                    matrixMeta={matrixMeta}
                    keys={keys}
                    onToggle={matrixDisabled ? undefined : toggleKey}
                    disabled={matrixDisabled}
                  />
                </div>
              ) : null}

              {selected?.is_locked ? (
                <p className="text-sm text-muted-foreground">The Owner role cannot be modified.</p>
              ) : null}
              {selected?.is_system && !selected.is_locked && selected.slug !== "admin" ? (
                <p className="text-sm text-muted-foreground">
                  System roles are read-only. Duplicate or use as a template to customize access.
                </p>
              ) : null}

              {(creating || editable) && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !name.trim() || keys.size === 0}
                  >
                    {creating ? "Create role" : "Save changes"}
                  </Button>
                  {creating ? (
                    <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

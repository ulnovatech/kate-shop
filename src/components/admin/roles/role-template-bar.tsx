import { Button } from "@/components/ui/button";
import {
  ROLE_TEMPLATES,
  permissionKeysForRoleTemplate,
  type RoleTemplate,
} from "@/lib/role-templates";
import type { PermissionKey } from "@/lib/permissions";

type RoleTemplateBarProps = {
  onApply: (template: RoleTemplate, keys: PermissionKey[]) => void;
  disabled?: boolean;
};

export function RoleTemplateBar({ onApply, disabled }: RoleTemplateBarProps) {
  return (
    <div className="rounded-lg border bg-secondary/30 p-4">
      <p className="text-sm font-medium">Start from a template</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Pick a preset permission set, then tailor the name and access.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ROLE_TEMPLATES.map((template) => (
          <Button
            key={template.slug}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onApply(template, permissionKeysForRoleTemplate(template.slug))}
          >
            {template.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

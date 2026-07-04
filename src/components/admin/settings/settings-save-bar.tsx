import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminPrimaryTouch } from "@/lib/admin-mobile";

type SettingsSaveBarProps = {
  dirty?: boolean;
  saving?: boolean;
  onSave: () => void;
  label?: string;
  className?: string;
};

/** Sticky save feedback for settings-area pages with deferred saves. */
export function SettingsSaveBar({
  dirty = true,
  saving = false,
  onSave,
  label = "Save changes",
  className,
}: SettingsSaveBarProps) {
  if (!dirty && !saving) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-14 z-sticky border-t bg-background/95 p-4 backdrop-blur-sm",
        "md:static md:bottom-auto md:mt-stack-lg md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-inline">
        <p className="type-caption text-muted-foreground">You have unsaved changes</p>
        <Button
          type="button"
          disabled={saving || !dirty}
          className={adminPrimaryTouch}
          onClick={onSave}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving
            </>
          ) : (
            label
          )}
        </Button>
      </div>
    </div>
  );
}

type SettingsSectionProps<T extends Record<string, unknown>> = {
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void | Promise<void>;
  saving: boolean;
  className?: string;
};

export function SettingsSection({
  title,
  description,
  children,
  onSave,
  saving,
  className,
}: SettingsSectionProps<Record<string, unknown>>) {
  return (
    <section
      className={cn("space-y-stack rounded-lg border bg-card p-card shadow-elevated", className)}
    >
      <div>
        <h2 className="type-h3">{title}</h2>
        {description ? (
          <p className="mt-1 type-body-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
      <Button
        type="button"
        disabled={saving}
        className={adminPrimaryTouch}
        onClick={() => void onSave()}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          `Save ${title.toLowerCase()}`
        )}
      </Button>
    </section>
  );
}

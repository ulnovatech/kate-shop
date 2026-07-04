import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ADMIN_KEYBOARD_SHORTCUTS,
  shortcutKeysForPlatform,
} from "@/lib/admin-keyboard-shortcuts";

type AdminKeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminKeyboardShortcutsDialog({
  open,
  onOpenChange,
}: AdminKeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Quick navigation and tools while working in the admin app.
          </DialogDescription>
        </DialogHeader>
        <dl className="mt-4 space-y-3">
          {ADMIN_KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div key={shortcut.id} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{shortcut.label}</dt>
              <dd>
                <kbd className="rounded border bg-muted px-2 py-1 font-mono text-xs">
                  {shortcutKeysForPlatform(shortcut.keys)}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

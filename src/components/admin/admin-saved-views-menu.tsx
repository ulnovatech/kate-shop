import { useMemo, useState } from "react";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminToolbarControl } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  deleteSavedListView,
  getSavedListViews,
  saveListView,
  type SavedListView,
} from "@/lib/saved-list-views";

type AdminSavedViewsMenuProps<TFilters extends Record<string, unknown>> = {
  storageKey: string;
  currentFilters: TFilters;
  presets?: { name: string; filters: TFilters }[];
  onApply: (filters: TFilters) => void;
};

export function AdminSavedViewsMenu<TFilters extends Record<string, unknown>>({
  storageKey,
  currentFilters,
  presets = [],
  onApply,
}: AdminSavedViewsMenuProps<TFilters>) {
  const [views, setViews] = useState<SavedListView<TFilters>[]>(() =>
    getSavedListViews<TFilters>(storageKey),
  );
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = () => setViews(getSavedListViews<TFilters>(storageKey));

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    saveListView(storageKey, name, currentFilters);
    setSaveName("");
    setSaving(false);
    refresh();
  };

  const menuItems = useMemo(
    () => [...presets, ...views.map((v) => ({ name: v.name, filters: v.filters, id: v.id }))],
    [presets, views],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(adminToolbarControl, "px-2.5 md:px-4")}
        >
          <Bookmark className="mr-1.5 h-4 w-4 md:mr-2" aria-hidden />
          Views
          <ChevronDown className="ml-1.5 h-4 w-4 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {saving ? (
          <div className="space-y-2 p-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="View name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" className="flex-1" onClick={handleSave}>
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSaving(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem onSelect={() => setSaving(true)}>
            Save current filters…
          </DropdownMenuItem>
        )}
        {menuItems.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            {presets.map((preset) => (
              <DropdownMenuItem
                key={`preset-${preset.name}`}
                onSelect={() => onApply(preset.filters)}
              >
                {preset.name}
              </DropdownMenuItem>
            ))}
            {views.map((view) => (
              <DropdownMenuItem
                key={view.id}
                className="flex items-center justify-between gap-2"
                onSelect={() => onApply(view.filters)}
              >
                <span className="truncate">{view.name}</span>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
                  aria-label={`Delete ${view.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedListView(storageKey, view.id);
                    refresh();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

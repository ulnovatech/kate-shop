import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { CATEGORY_ACTIONS_LONG_PRESS_MS } from "./category-actions-menu";

const HINT_DISMISSED_KEY = "admin-categories-hint-dismissed";

function readHintDismissed() {
  try {
    return sessionStorage.getItem(HINT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function CategoryListHint({ liveMessage }: { liveMessage: string }) {
  const [dismissed, setDismissed] = useState(readHintDismissed);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    setDismissed(true);
  }, []);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      {!dismissed && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          <p className="min-w-0 flex-1 leading-relaxed">
            Tap a name to edit · tap status to show or hide · drag the grip to reorder (or focus the
            grip and use arrow keys) · press Escape to cancel a drag · long-press (
            {CATEGORY_ACTIONS_LONG_PRESS_MS / 1000}s) or right-click for options
          </p>
          <button
            type="button"
            data-no-drag
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Dismiss tips"
            onClick={dismiss}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}
    </>
  );
}

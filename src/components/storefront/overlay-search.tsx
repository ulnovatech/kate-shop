import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { TOUCH_TARGET_CLASS, TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

export type StorefrontOverlaySearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  searchLabel?: string;
  inputId?: string;
  className?: string;
  autoFocus?: boolean;
  /** Extra content below the field (e.g. suggestions) — only in mobile sheet */
  sheetChildren?: React.ReactNode;
};

export function StorefrontOverlaySearch({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Search products…",
  searchLabel = "Search",
  inputId: inputIdProp,
  className,
  autoFocus = true,
  sheetChildren,
}: StorefrontOverlaySearchProps) {
  const isMobile = useIsMobile();
  const generatedId = useId();
  const inputId = inputIdProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  const setOpen = isMobile ? setSheetOpen : setDesktopOpen;
  const showDesktopField = !isMobile && (desktopOpen || value.length > 0);

  const handleClear = useCallback(() => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    if (!showDesktopField || !autoFocus) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showDesktopField, autoFocus]);

  useEffect(() => {
    if (!showDesktopField) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (value) handleClear();
        else handleClose();
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        if (!value) handleClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [showDesktopField, value, handleClear, handleClose]);

  const searchField = (
    <form
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
        if (isMobile) setSheetOpen(false);
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("h-11 pl-9", value && "pr-9")}
        aria-label={searchLabel}
        autoComplete="off"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </form>
  );

  if (isMobile) {
    return (
      <div className={cn("shrink-0", className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(TOUCH_TARGET_CLASS, TRANSITION_COMMON_CLASS)}
          onClick={() => setSheetOpen(true)}
          aria-label={searchLabel}
          aria-expanded={sheetOpen}
          aria-controls={`${inputId}-sheet`}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="top"
            id={`${inputId}-sheet`}
            className="max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            aria-describedby={undefined}
          >
            <SheetHeader className="text-left">
              <SheetTitle className="font-heading">{searchLabel}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {searchField}
              {sheetChildren}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex shrink-0 items-center", className)}
      data-search-open={showDesktopField || undefined}
    >
      {showDesktopField ? (
        <div
          className={cn(
            "w-[min(100%,16rem)] motion-safe:animate-scale-in sm:w-72",
            TRANSITION_COMMON_CLASS,
          )}
        >
          {searchField}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(TOUCH_TARGET_CLASS, TRANSITION_COMMON_CLASS)}
          onClick={() => setDesktopOpen(true)}
          aria-label={searchLabel}
          aria-expanded={false}
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

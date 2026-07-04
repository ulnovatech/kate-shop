import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminToolbarControl } from "@/lib/admin-mobile";
import { cn } from "@/lib/utils";
import { TRANSITION_COMMON_CLASS } from "@kate/ui/tokens";

export type OverlaySearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  /** Accessible name for the search trigger */
  searchLabel?: string;
  inputId?: string;
  className?: string;
  autoFocus?: boolean;
};

export function OverlaySearch({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  searchLabel = "Search",
  inputId: inputIdProp,
  className,
  autoFocus = true,
}: OverlaySearchProps) {
  const generatedId = useId();
  const inputId = inputIdProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userExpanded, setUserExpanded] = useState(false);

  const hasQuery = value.length > 0;
  const expanded = userExpanded || hasQuery;

  const handleClear = useCallback(() => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleClose = useCallback(() => {
    setUserExpanded(false);
  }, []);

  useEffect(() => {
    if (!expanded || !autoFocus) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [expanded, autoFocus]);

  useEffect(() => {
    if (!expanded) return;

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
  }, [expanded, value, handleClear, handleClose]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none",
        expanded ? "w-[min(100%,11rem)] sm:w-52 md:w-64" : "w-9",
        className,
      )}
      data-search-expanded={expanded || undefined}
    >
      {expanded ? (
        <div className="relative w-full motion-safe:animate-scale-in">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-primary md:left-3"
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
            className={cn(adminToolbarControl, "w-full pl-8", value && "pr-8 md:pr-9")}
            aria-label={searchLabel}
          />
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-0.5 h-7 w-7 -translate-y-1/2 md:right-1 md:h-8 md:w-8"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-9 w-9 md:h-11 md:w-11", TRANSITION_COMMON_CLASS)}
          onClick={() => setUserExpanded(true)}
          aria-label={searchLabel}
          aria-expanded={false}
        >
          <Search className="h-4 w-4 text-primary" aria-hidden />
        </Button>
      )}
    </div>
  );
}

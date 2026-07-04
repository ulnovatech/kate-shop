import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CategoryInlineNameField({
  value,
  placeholder,
  autoFocus,
  onCommit,
  onCancel,
  className,
}: {
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onCommit: (value: string) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [autoFocus]);

  useEffect(() => {
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 80);

    const commitOrCancel = () => {
      const trimmed = draft.trim();
      if (!trimmed) {
        onCancel?.();
        return;
      }
      if (trimmed === value.trim()) {
        onCancel?.();
        return;
      }
      onCommit(trimmed);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!armed) return;
      if (inputRef.current?.contains(e.target as Node)) return;
      commitOrCancel();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [draft, onCancel, onCommit, value]);

  return (
    <Input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder={placeholder}
      className={cn("h-9 border-primary/30 bg-background", className)}
      data-no-drag
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const trimmed = draft.trim();
          if (!trimmed) {
            onCancel?.();
            return;
          }
          if (trimmed === value.trim()) {
            onCancel?.();
            return;
          }
          onCommit(trimmed);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel?.();
        }
      }}
    />
  );
}

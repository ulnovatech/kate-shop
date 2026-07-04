import { Loader2 } from "lucide-react";
import { cn } from "@kate/ui/utils";

type PageLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-10 w-10",
} as const;

export function PageLoader({ className, size = "md", label }: PageLoaderProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClass[size])} aria-hidden />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

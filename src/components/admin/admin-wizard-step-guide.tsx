import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminWizardStepGuideProps = {
  children: ReactNode;
  className?: string;
};

/** Short, action-oriented instruction shown at the top of a wizard step. */
export function AdminWizardStepGuide({ children, className }: AdminWizardStepGuideProps) {
  return (
    <p className={cn("type-body-sm text-muted-foreground", className)} role="doc-subtitle">
      {children}
    </p>
  );
}

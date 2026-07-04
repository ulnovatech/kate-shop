import type { ReactNode } from "react";
import { MOTION_ENTER, type MotionEnterVariant } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MotionEnterProps = {
  children: ReactNode;
  variant?: MotionEnterVariant;
  className?: string;
  as?: "div" | "section" | "span";
};

export function MotionEnter({
  children,
  variant = "slideUp",
  className,
  as: Tag = "div",
}: MotionEnterProps) {
  return <Tag className={cn(MOTION_ENTER[variant], className)}>{children}</Tag>;
}

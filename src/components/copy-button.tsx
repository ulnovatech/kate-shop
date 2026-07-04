import { Copy } from "lucide-react";
import { appToast } from "@/lib/app-toast";
import { triggerHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  label?: string;
  successMessage?: string;
  className?: string;
  variant?: "outline" | "ghost" | "default" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

export function CopyButton({
  text,
  label = "Copy",
  successMessage = "Copied to clipboard",
  className,
  variant = "outline",
  size = "sm",
}: CopyButtonProps) {
  const copy = async () => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      triggerHaptic("light");
      appToast.success(successMessage);
    } else {
      appToast.recoverableError("Could not copy");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      onClick={() => void copy()}
    >
      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      {label}
    </Button>
  );
}

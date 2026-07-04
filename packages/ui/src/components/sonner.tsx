import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const TOAST_BASE =
  "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group z-toast"
      closeButton
      toastOptions={{
        classNames: {
          toast: TOAST_BASE,
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-surface-success/15",
          error: "group-[.toaster]:border-destructive/40 group-[.toaster]:bg-surface-danger/10",
          warning:
            "group-[.toaster]:border-amber-500/40 group-[.toaster]:bg-surface-attention/15",
          info: "group-[.toaster]:border-primary/25 group-[.toaster]:bg-surface-muted/80",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

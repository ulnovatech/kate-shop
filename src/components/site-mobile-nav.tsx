import { Link } from "@tanstack/react-router";
import { Home, MessageCircle, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStoreBranding } from "@/lib/store-branding-context";
import { productImageUrl, whatsappUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

/** Primary mobile nav — Shop first (main destination). */
const MOBILE_NAV: NavItem[] = [
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/contact", label: "Contact", icon: MessageCircle },
  { to: "/", label: "Home", icon: Home, exact: true },
];

type SiteMobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  welcomeName?: string | null;
};

export function SiteMobileNav({ open, onOpenChange, welcomeName }: SiteMobileNavProps) {
  const { shopName, logoUrl, whatsapp } = useStoreBranding();
  const logoSrc = logoUrl?.startsWith("http") ? logoUrl : logoUrl ? productImageUrl(logoUrl) : null;

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[min(100vw-2rem,18rem)] flex-col p-0"
        aria-describedby={undefined}
      >
        <SheetHeader className="border-b px-5 py-5 text-left">
          <SheetTitle className="font-heading text-primary">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={shopName}
                className="h-9 w-auto max-w-[140px] object-contain"
              />
            ) : (
              shopName
            )}
          </SheetTitle>
          {welcomeName && (
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="font-medium text-foreground">{welcomeName}</span>
            </p>
          )}
        </SheetHeader>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Mobile navigation">
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={close}
              activeOptions={{ exact: item.exact }}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary/10 [&.active]:text-primary",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4 pb-[env(safe-area-inset-bottom)]">
          <Button
            asChild
            size="lg"
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <a
              href={whatsappUrl(`Hello ${shopName}!`, whatsapp)}
              target="_blank"
              rel="noreferrer"
              onClick={close}
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              Message us on WhatsApp
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

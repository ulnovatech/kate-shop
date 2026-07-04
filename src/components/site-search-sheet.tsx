import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShopSearchPanel } from "@/components/shop-search-panel";
import { TOUCH_TARGET_CLASS } from "@kate/ui/tokens";
import { cn } from "@/lib/utils";

type SiteSearchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SiteSearchSheet({ open, onOpenChange }: SiteSearchSheetProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const prevOpen = useRef(open);

  useEffect(() => {
    if (open && !prevOpen.current) setQuery("");
    prevOpen.current = open;
  }, [open]);

  const goToSearch = (term: string) => {
    const trimmed = term.trim();
    onOpenChange(false);
    navigate({
      to: "/shop",
      search: trimmed ? { q: trimmed } : {},
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        aria-describedby={undefined}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading">Search products</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <ShopSearchPanel
            value={query}
            onChange={setQuery}
            onSearch={goToSearch}
            onClear={() => setQuery("")}
            active={open}
            layout="stacked"
            autoFocus={open}
            inputId="header-shop-search"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteSearchTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(TOUCH_TARGET_CLASS, className)}
      onClick={onClick}
      aria-label="Search products"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}

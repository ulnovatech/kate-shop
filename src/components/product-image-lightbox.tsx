import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinchZoomImage } from "@/components/storefront/pinch-zoom-image";
import { productImageAlt, resolveProductImageUrl, type ProductImageFields } from "@/lib/shop";
import { cn } from "@/lib/utils";

type ProductImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ProductImageFields[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  productName: string;
};

export function ProductImageLightbox({
  open,
  onOpenChange,
  images,
  activeIndex,
  onActiveIndexChange,
  productName,
}: ProductImageLightboxProps) {
  const active = images[activeIndex];
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!open || !hasMultiple) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onActiveIndexChange(Math.max(0, activeIndex - 1));
      } else if (e.key === "ArrowRight") {
        onActiveIndexChange(Math.min(images.length - 1, activeIndex + 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, hasMultiple, activeIndex, images.length, onActiveIndexChange]);

  if (!active) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] w-[min(100vw-1rem,56rem)] max-w-none gap-0 overflow-hidden border-none bg-black/95 p-0 text-white sm:rounded-lg"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{productName} — image viewer</DialogTitle>
        <DialogDescription className="sr-only">
          Image {activeIndex + 1} of {images.length}. Pinch to zoom or double-tap. Use arrows to browse.
        </DialogDescription>

        <div className="relative flex max-h-[75vh] min-h-[50vh] items-center justify-center">
          {hasMultiple && activeIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 min-h-11 min-w-11 text-white hover:bg-white/10"
              aria-label="Previous image"
              onClick={() => onActiveIndexChange(activeIndex - 1)}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          <PinchZoomImage
            src={resolveProductImageUrl(active, "full")}
            alt={productImageAlt(active, productName)}
          />

          {hasMultiple && activeIndex < images.length - 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 min-h-11 min-w-11 text-white hover:bg-white/10"
              aria-label="Next image"
              onClick={() => onActiveIndexChange(activeIndex + 1)}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {hasMultiple && (
          <div className="flex gap-2 overflow-x-auto border-t border-white/10 p-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onActiveIndexChange(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
                className={cn(
                  "aspect-square w-14 shrink-0 overflow-hidden rounded-md border-2",
                  i === activeIndex
                    ? "border-gold"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img
                  src={resolveProductImageUrl(img, "thumb")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { Link2, Copy, X } from "lucide-react";
import { appToast } from "@/lib/app-toast";
import { copyTextToClipboard } from "@/lib/clipboard";
import { triggerHaptic } from "@/lib/haptics";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/shop";
import {
  buildProductShareCaption,
  buildProductShareText,
  buildProductShareUrl,
  executeSharePlatform,
  SHARE_PLATFORMS,
  type SharePlatform,
  type ShareProductInput,
} from "@/lib/share-product";
import { cn } from "@/lib/utils";

export type ProductSharePayload = ShareProductInput & {
  imageUrls: string[];
};

type ProductShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: ProductSharePayload;
};

function PlatformIcon({ platform, className }: { platform: SharePlatform; className?: string }) {
  const base = cn("h-5 w-5", className);
  switch (platform) {
    case "copy_link":
      return <Link2 className={base} aria-hidden />;
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className={base} aria-hidden fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.917l4.458-1.495A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.78 9.78 0 0 1-4.988-1.364l-.357-.212-2.645.886.886-2.578-.233-.375A9.818 9.818 0 1 1 12 21.818z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={base} aria-hidden fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={base} aria-hidden fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={base} aria-hidden fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      );
    case "snapchat":
      return (
        <svg viewBox="0 0 24 24" className={base} aria-hidden fill="currentColor">
          <path d="M12.206.793c.99 0 4.347.276 5.866 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.539-.074.832 0 .449-.104.899-.45 1.199-.435.389-1.079.524-1.858.524-.359 0-.734-.045-1.109-.104-1.053-.165-2.496-.45-3.996-.45-1.053 0-2.071.15-2.996.45-.36.104-.72.149-1.053.149-.764 0-1.393-.12-1.828-.494-.391-.359-.525-.854-.525-1.348 0-.284.045-.554.075-.749.045-.195.105-.479.165-.569-1.872-.284-2.905-.703-3.146-1.271-.031-.061-.045-.135-.045-.225-.015-.24.165-.465.42-.509 3.264-.54 4.74-3.879 4.785-4.014l.015-.015c.18-.345.209-.645.119-.869-.195-.449-.884-.674-1.333-.809a8.793 8.793 0 0 1-.344-.119c-.822-.33-1.228-.72-1.213-1.169 0-.359.285-.689.735-.838.149-.045.326-.075.509-.075.12 0 .285.015.449.104.374.181.733.301 1.033.301.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.656 1.069 11.013.793 12.003.793h.203z" />
        </svg>
      );
    default:
      return null;
  }
}

const PLATFORM_STYLES: Record<SharePlatform, string> = {
  copy_link: "bg-secondary text-foreground",
  whatsapp: "bg-[#25D366] text-white",
  x: "bg-foreground text-background",
  facebook: "bg-[#1877F2] text-white",
  instagram: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
  snapchat: "bg-[#FFFC00] text-black",
};

export function ProductShareSheet({ open, onOpenChange, payload }: ProductShareSheetProps) {
  const [previewImg, setPreviewImg] = useState(0);
  const images = payload.imageUrls.length > 0 ? payload.imageUrls : [];
  const caption = buildProductShareCaption(payload);
  const shareUrl = buildProductShareUrl(payload.slug);

  useEffect(() => {
    if (open) setPreviewImg(0);
  }, [open, payload.slug]);

  const onPlatform = async (platform: SharePlatform) => {
    const result = await executeSharePlatform(platform, payload);
    if (result.ok) appToast.success(result.toastMessage);
    else appToast.recoverableError(result.toastMessage);
    if (result.closeSheet) onOpenChange(false);
  };

  const onCopyMessage = async () => {
    const fullText = buildProductShareText(payload);
    const ok = await copyTextToClipboard(fullText);
    if (ok) {
      triggerHaptic("light");
      appToast.success("Message copied — paste anywhere");
    } else {
      appToast.recoverableError("Could not copy message");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-border/80 bg-background shadow-2xl outline-none",
            "pb-[max(1rem,env(safe-area-inset-bottom))]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300",
          )}
          aria-describedby="share-sheet-description"
        >
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30"
            aria-hidden
          />

          <div className="flex items-center justify-between border-b px-5 py-3">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold">
              Share this piece
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-9 min-w-9"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            <div
              className={cn(
                "overflow-hidden rounded-xl border-2 border-gold/40 bg-card shadow-lg shadow-gold/10 ring-1 ring-gold/20",
              )}
            >
              {images.length > 0 && (
                <div className="relative bg-secondary">
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={images[previewImg] ?? images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {images.length > 1 && (
                    <div
                      className="flex gap-1.5 overflow-x-auto border-t bg-background/95 p-2 snap-x snap-mandatory"
                      role="list"
                      aria-label="Product images"
                    >
                      {images.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          role="listitem"
                          onClick={() => setPreviewImg(i)}
                          className={cn(
                            "aspect-square w-14 shrink-0 snap-start overflow-hidden rounded-md border-2 transition-colors",
                            i === previewImg
                              ? "border-gold ring-1 ring-gold/40"
                              : "border-transparent opacity-80",
                          )}
                          aria-label={`Preview image ${i + 1}`}
                          aria-current={i === previewImg ? "true" : undefined}
                        >
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 p-4">
                <p className="font-heading text-base font-semibold leading-snug">{payload.name}</p>
                <p className="text-lg font-semibold text-primary">{formatKES(payload.price)}</p>
                <p className="text-xs text-muted-foreground">{payload.shopName}</p>
                {payload.description && (
                  <p className="line-clamp-2 text-sm text-foreground/80">{payload.description}</p>
                )}
                <div className="rounded-md bg-secondary/80 px-3 py-2">
                  <p
                    id="share-sheet-description"
                    className="text-xs leading-relaxed text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">Message preview:</span> {caption}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-primary">{shareUrl}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 px-2 text-xs"
                    onClick={() => void onCopyMessage()}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy full message
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Share via
            </p>
            <div
              className="mt-3 flex gap-3 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
            >
              {SHARE_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="listitem"
                  title={p.hint}
                  onClick={() => void onPlatform(p.id)}
                  className="flex min-w-[4.25rem] shrink-0 flex-col items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full shadow-sm",
                      PLATFORM_STYLES[p.id],
                    )}
                  >
                    <PlatformIcon platform={p.id} />
                  </span>
                  <span className="max-w-[4.5rem] text-center text-[11px] font-medium leading-tight text-foreground">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Instagram &amp; Snapchat: caption + link copied — paste in the app. X &amp; Facebook
              open with link preview. WhatsApp sends the full message.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

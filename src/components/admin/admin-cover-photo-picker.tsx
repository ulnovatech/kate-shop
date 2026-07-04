import { useRef, type ChangeEvent } from "react";
import { Camera, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  openCameraCapture,
  openGalleryPicker,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_CAMERA_ACCEPT,
  PRODUCT_IMAGE_CAMERA_CAPTURE,
  resetFileInput,
} from "@/lib/mobile-upload";
import { resolveProductImageUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { SURFACE_CLASSES } from "@kate/ui/tokens";

export type CoverPhotoValue = {
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  full_url?: string;
};

type AdminCoverPhotoPickerProps = {
  title?: string;
  description?: string;
  value: CoverPhotoValue | null;
  uploading?: boolean;
  onChange: (next: CoverPhotoValue | null) => void;
  onUpload: (file: File) => Promise<CoverPhotoValue>;
};

export function AdminCoverPhotoPicker({
  title = "Cover photo",
  description = "Shown on category chips and navigation. JPEG, PNG, or WebP — max 12 MB.",
  value,
  uploading = false,
  onChange,
  onUpload,
}: AdminCoverPhotoPickerProps) {
  const isMobile = useIsMobile();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const previewSrc = value
    ? resolveProductImageUrl(
        {
          image_url: value.image_url,
          thumbnail_url: value.thumbnail_url ?? null,
          medium_url: value.medium_url ?? null,
          full_url: value.full_url ?? null,
        },
        "medium",
      )
    : "";

  const handleFiles = async (files: FileList | null, input?: HTMLInputElement | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const uploaded = await onUpload(file);
      onChange(uploaded);
    } finally {
      resetFileInput(input ?? null);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files, e.target);
  };

  return (
    <section className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
      <h2 className="type-h3">{title}</h2>
      <p className="mt-1 type-body-sm text-muted-foreground">{description}</p>

      <div className="mt-stack space-y-stack">
        {previewSrc ? (
          <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-lg border bg-muted">
            <img src={previewSrc} alt="" className="aspect-square w-full object-cover" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2 h-8 gap-1"
              disabled={uploading}
              onClick={() => onChange(null)}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        ) : (
          <p className="rounded-md border border-dashed px-4 py-6 text-center type-body-sm text-muted-foreground">
            No cover yet — add one so shoppers recognize this category.
          </p>
        )}

        {isMobile ? (
          <div className="flex flex-col gap-3 rounded-md border-2 border-dashed border-border px-4 py-6">
            <p className="text-center type-caption text-muted-foreground">
              {uploading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Preparing photo
                </span>
              ) : (
                "JPEG, PNG, WebP — max 12 MB"
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 flex-col gap-2 py-4"
                disabled={uploading}
                onClick={() => openCameraCapture(cameraInputRef.current)}
              >
                <Camera className="h-5 w-5" />
                <span className="type-caption">Take photo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 flex-col gap-2 py-4"
                disabled={uploading}
                onClick={() => openGalleryPicker(galleryInputRef.current)}
              >
                <ImagePlus className="h-5 w-5" />
                <span className="type-caption">From gallery</span>
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept={PRODUCT_IMAGE_CAMERA_ACCEPT}
              capture={PRODUCT_IMAGE_CAMERA_CAPTURE}
              className="hidden"
              disabled={uploading}
              onChange={onFileInputChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={onFileInputChange}
            />
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-6 py-8 type-caption text-muted-foreground hover:border-primary hover:text-foreground">
            <Upload className="h-5 w-5" />
            <span>
              {uploading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Preparing photo
                </span>
              ) : (
                "Upload cover image"
              )}
            </span>
            <input
              ref={galleryInputRef}
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={onFileInputChange}
            />
          </label>
        )}
      </div>
    </section>
  );
}

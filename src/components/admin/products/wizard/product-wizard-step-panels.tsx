import type { ChangeEvent, RefObject } from "react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Camera, ChevronDown, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminToggleField } from "@/components/admin/admin-toggle-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageReorderGrid } from "@/components/image-reorder-grid";
import { resolveProductImageUrl } from "@/lib/shop";
import { categorySelectIndent } from "@/lib/categories";
import { formatKES } from "@/lib/shop";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_CAMERA_ACCEPT,
  PRODUCT_IMAGE_CAMERA_CAPTURE,
} from "@/lib/mobile-upload";
import { cn } from "@/lib/utils";
import { SURFACE_CLASSES } from "@kate/ui/tokens";
import type { ProductWizardFormData } from "./product-wizard-schema";
import type { ProductWizardImage } from "./types";

type CategoryOption = { id: string; label: string; depth: number };

type StepPanelProps = {
  form: UseFormReturn<ProductWizardFormData>;
};

type PhotosStepProps = StepPanelProps & {
  images: ProductWizardImage[];
  productName: string;
  uploading: boolean;
  isMobile: boolean;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onUpdateAlt: (idx: number, alt: string) => void;
  onRemoveImage: (idx: number) => void;
  onMoveImage: (idx: number, dir: -1 | 1) => void;
  onReorderImages: (next: ProductWizardImage[]) => void;
  onOpenGallery: () => void;
  onOpenCamera: () => void;
};

export function PhotosStepPanel({
  images,
  productName,
  uploading,
  isMobile,
  galleryInputRef,
  cameraInputRef,
  onFileInputChange,
  onUpdateAlt,
  onRemoveImage,
  onMoveImage,
  onReorderImages,
  onOpenGallery,
  onOpenCamera,
}: PhotosStepProps) {
  return (
    <section className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
      <h2 className="type-h3">Product photos</h2>
      <p className="mt-1 type-body-sm text-muted-foreground">
        Uploads are resized to thumb, display, and full sizes. The first image is the cover photo.
      </p>
      <div className="mt-stack space-y-stack">
        {images.length > 0 ? (
          <ImageReorderGrid
            items={images}
            onReorder={(next) => onReorderImages(next.map((x, i) => ({ ...x, sort_order: i })))}
            keyFn={(img) => img.id ?? img.image_url}
            renderItem={(img, i) => (
              <div className="flex gap-4">
                <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    src={resolveProductImageUrl(img, "thumb")}
                    alt={img.alt_text || productName}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-gold px-1 py-0.5 text-[9px] font-semibold text-gold-foreground">
                      Cover
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <Label className="type-caption">Alt text</Label>
                    <Input
                      value={img.alt_text}
                      onChange={(e) => onUpdateAlt(i, e.target.value)}
                      placeholder={productName || "Describe this image"}
                      className="mt-1"
                      maxLength={200}
                    />
                  </div>
                  <div className="flex gap-1">
                    {isMobile ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={i === 0}
                          onClick={() => onMoveImage(i, -1)}
                        >
                          ←
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={i === images.length - 1}
                          onClick={() => onMoveImage(i, 1)}
                        >
                          →
                        </Button>
                      </>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onRemoveImage(i)}
                    >
                      <X className="mr-1 h-3 w-3" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        ) : (
          <p className="rounded-md border border-dashed px-4 py-6 text-center type-body-sm text-muted-foreground">
            No photos yet — add at least one before publishing for the best shop experience.
          </p>
        )}

        {isMobile ? (
          <div className="flex flex-col gap-3 rounded-md border-2 border-dashed border-border px-4 py-6">
            <p className="text-center type-caption text-muted-foreground">
              {uploading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Preparing photos
                </span>
              ) : (
                "JPEG, PNG, WebP — max 12 MB each"
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 flex-col gap-2 py-4"
                disabled={uploading}
                onClick={onOpenCamera}
              >
                <Camera className="h-5 w-5" />
                <span className="type-caption">Take photo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 flex-col gap-2 py-4"
                disabled={uploading}
                onClick={onOpenGallery}
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
              multiple
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
                  Preparing photos
                </span>
              ) : (
                "Upload images (JPEG, PNG, WebP — max 12 MB)"
              )}
            </span>
            <input
              ref={galleryInputRef}
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              multiple
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

export function EssentialsStepPanel({ form }: StepPanelProps) {
  const errors = form.formState.errors;

  return (
    <section className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
      <h2 className="type-h3">Essentials</h2>
      <p className="mt-1 type-body-sm text-muted-foreground">
        Name and details customers see on the product page.
      </p>
      <div className="mt-stack space-y-stack">
        <div>
          <Label htmlFor="wizard-name">Name</Label>
          <Input id="wizard-name" {...form.register("name")} className="mt-1.5" />
          {errors.name ? (
            <p className="mt-1 type-caption text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="wizard-description">Description</Label>
          <Textarea
            id="wizard-description"
            {...form.register("description")}
            rows={5}
            className="mt-1.5"
          />
        </div>
        <div className="grid grid-cols-1 gap-stack sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="wizard-material">Material</Label>
            <Input
              id="wizard-material"
              {...form.register("material")}
              className="mt-1.5"
              placeholder="e.g. 18k Gold"
            />
          </div>
        </div>
        <p className="type-caption text-muted-foreground">
          SKU is assigned automatically when you save this product.
        </p>
      </div>
    </section>
  );
}

type EssentialsCategoryProps = StepPanelProps & {
  categoryOptions: CategoryOption[];
};

export function EssentialsCategoryField({ form, categoryOptions }: EssentialsCategoryProps) {
  return (
    <div className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
      <Label>Category</Label>
      <Select
        value={form.watch("category_id") ?? "none"}
        onValueChange={(v) => form.setValue("category_id", v === "none" ? null : v)}
      >
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {categoryOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {categorySelectIndent(option.depth)}
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type StockStepProps = StepPanelProps & {
  reservedStock?: number;
};

export function StockPricingStepPanel({ form, reservedStock = 0 }: StockStepProps) {
  const stock = form.watch("stock_quantity") || 0;
  const available = Math.max(0, stock - reservedStock);

  return (
    <section className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
      <h2 className="type-h3">Stock & pricing</h2>
      <p className="mt-1 type-body-sm text-muted-foreground">
        Set the price in UGX and how many units you have on hand.
      </p>
      <div className="mt-stack grid gap-stack sm:grid-cols-2">
        <div>
          <Label htmlFor="wizard-price">Price (UGX)</Label>
          <Input
            id="wizard-price"
            type="number"
            step="1"
            {...form.register("price")}
            className="mt-1.5"
          />
          {form.formState.errors.price ? (
            <p className="mt-1 type-caption text-destructive">
              {form.formState.errors.price.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="wizard-stock">Stock on hand</Label>
          <Input
            id="wizard-stock"
            type="number"
            step="1"
            {...form.register("stock_quantity")}
            className="mt-1.5"
          />
          {reservedStock > 0 ? (
            <p className="mt-1 type-caption text-muted-foreground">
              {reservedStock} reserved — available: {available}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="wizard-low-stock">Low stock alert at</Label>
          <Input
            id="wizard-low-stock"
            type="number"
            step="1"
            {...form.register("low_stock_threshold")}
            className="mt-1.5"
          />
        </div>
      </div>
    </section>
  );
}

export function VisibilitySeoStepPanel({ form }: StepPanelProps) {
  const [seoOpen, setSeoOpen] = useState(false);
  const isVisible = form.watch("is_visible");

  return (
    <div className="space-y-stack">
      <section className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
        <h2 className="type-h3">Shop visibility</h2>
        <p className="mt-1 type-body-sm text-muted-foreground">
          Choose whether shoppers can see this product. Tap Save &amp; continue when you are done.
        </p>
        <div className="mt-stack space-y-3">
          <Controller
            name="is_visible"
            control={form.control}
            render={({ field }) => (
              <AdminToggleField
                id="wizard-is-visible"
                label="Visible on shop"
                description="Hidden products are saved as drafts and not shown to customers."
                checked={!!field.value}
                onCheckedChange={(value) => {
                  field.onChange(value);
                  if (!value && form.getValues("is_featured")) {
                    form.setValue("is_featured", false, { shouldDirty: true });
                  }
                }}
              />
            )}
          />
          <Controller
            name="is_featured"
            control={form.control}
            render={({ field }) => (
              <AdminToggleField
                id="wizard-is-featured"
                label="Featured"
                description={
                  isVisible
                    ? "Highlighted on the home page."
                    : "Turn on shop visibility first to feature this product."
                }
                checked={!!field.value}
                onCheckedChange={field.onChange}
                disabled={!isVisible}
              />
            )}
          />
        </div>
      </section>

      <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
        <section
          className={cn("rounded-lg border shadow-elevated", SURFACE_CLASSES.elevated)}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 p-card text-left"
            >
              <div>
                <h2 className="type-h3">Search preview</h2>
                <p className="mt-0.5 type-body-sm text-muted-foreground">Optional</p>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  seoOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t px-card pb-card">
            <p className="pt-3 type-body-sm text-muted-foreground">
              How this product may appear in Google results.
            </p>
            <div className="mt-stack space-y-stack">
              <div>
                <Label htmlFor="wizard-meta-title">Search title</Label>
                <Input
                  id="wizard-meta-title"
                  {...form.register("meta_title")}
                  className="mt-1.5"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="wizard-meta-description">Search description</Label>
                <Textarea
                  id="wizard-meta-description"
                  {...form.register("meta_description")}
                  rows={3}
                  className="mt-1.5"
                  maxLength={320}
                />
              </div>
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>
    </div>
  );
}

type ReviewStepProps = StepPanelProps & {
  images: ProductWizardImage[];
  slug: string;
  categoryLabel: string;
};

export function ReviewStepPanel({ form, images, slug, categoryLabel }: ReviewStepProps) {
  const values = form.getValues();
  const cover = images[0];
  const coverSrc = cover ? resolveProductImageUrl(cover, "thumb") : "";

  return (
    <section className={cn("rounded-lg border p-card shadow-elevated", SURFACE_CLASSES.elevated)}>
      <h2 className="type-h3">Review before publishing</h2>
      <p className="mt-1 type-body-sm text-muted-foreground">
        Check everything looks right. You can go back to any step to make changes.
      </p>

      <div className="mt-stack overflow-hidden rounded-lg border bg-muted/30">
        <div className="flex flex-col sm:flex-row">
          <div className="flex h-40 w-full shrink-0 items-center justify-center bg-muted sm:h-auto sm:w-40">
            {coverSrc ? (
              <img src={coverSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="type-caption text-muted-foreground">No cover photo</span>
            )}
          </div>
          <div className="flex-1 space-y-2 p-card">
            <p className="type-h3">{values.name || "Untitled product"}</p>
            <p className="type-body-sm text-muted-foreground">{categoryLabel}</p>
            <p className="font-medium">{formatKES(values.price)}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 type-body-sm">
              <div>
                <dt className="text-muted-foreground">Stock</dt>
                <dd>{values.stock_quantity}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Photos</dt>
                <dd>{images.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Visibility</dt>
                <dd>{values.is_visible ? "Visible on shop" : "Hidden (draft)"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Featured</dt>
                <dd>{values.is_featured ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {slug ? (
              <p className="type-caption text-muted-foreground">
                Store link: <span className="font-mono">{slug}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {!values.is_visible ? (
        <p className="mt-stack rounded-md bg-surface-attention px-3 py-2 type-body-sm text-surface-attention-foreground">
          This product is hidden. Choose <strong>Publish to shop</strong> to make it visible, or save
          as a draft to finish later.
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="mt-inline type-caption text-amber-700">
          Tip: add at least one photo so customers can see what they are buying.
        </p>
      ) : null}
    </section>
  );
}

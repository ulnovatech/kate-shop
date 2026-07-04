import { supabase } from "@/integrations/supabase/client";

/** Documented output sizes for product images (max edge in px). */
export const IMAGE_VARIANTS = {
  thumb: { maxEdge: 200, quality: 0.78 },
  medium: { maxEdge: 800, quality: 0.82 },
  full: { maxEdge: 1600, quality: 0.85 },
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProcessedUpload = {
  image_url: string;
  thumbnail_url: string;
  medium_url: string;
  full_url: string;
};

function scaledDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed"))),
      type,
      quality,
    );
  });
}

let webpSupported: boolean | null = null;

async function outputMime(): Promise<{ mime: string; ext: string }> {
  if (webpSupported === null) {
    webpSupported = await new Promise((resolve) => {
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      c.toBlob((b) => resolve(!!b), "image/webp", 0.8);
    });
  }
  return webpSupported ? { mime: "image/webp", ext: "webp" } : { mime: "image/jpeg", ext: "jpg" };
}

export async function resizeImageToBlob(
  img: HTMLImageElement,
  variant: ImageVariant,
): Promise<Blob> {
  const { maxEdge, quality } = IMAGE_VARIANTS[variant];
  const { width, height } = scaledDimensions(img.naturalWidth, img.naturalHeight, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(img, 0, 0, width, height);
  const { mime } = await outputMime();
  return canvasToBlob(canvas, mime, quality);
}

export function validateImageFile(file: File): void {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Use JPEG, PNG, or WebP images only");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image must be 12 MB or smaller");
  }
}

export async function processAndUploadProductImage(file: File): Promise<ProcessedUpload> {
  validateImageFile(file);
  const img = await loadImage(file);
  const { ext } = await outputMime();
  const base = `uploads/${crypto.randomUUID()}`;

  const [thumb, medium, full] = await Promise.all([
    resizeImageToBlob(img, "thumb"),
    resizeImageToBlob(img, "medium"),
    resizeImageToBlob(img, "full"),
  ]);

  const paths = {
    thumb: `${base}/thumb.${ext}`,
    medium: `${base}/medium.${ext}`,
    full: `${base}/full.${ext}`,
  };

  const bucket = supabase.storage.from("product-images");
  const uploads = [
    { path: paths.thumb, blob: thumb },
    { path: paths.medium, blob: medium },
    { path: paths.full, blob: full },
  ];

  const uploaded: string[] = [];
  try {
    for (const { path, blob } of uploads) {
      const { error } = await bucket.upload(path, blob, {
        upsert: false,
        contentType: blob.type,
      });
      if (error) throw error;
      uploaded.push(path);
    }
  } catch (e) {
    if (uploaded.length) await bucket.remove(uploaded);
    throw e instanceof Error ? e : new Error("Upload failed");
  }

  return {
    image_url: paths.medium,
    thumbnail_url: paths.thumb,
    medium_url: paths.medium,
    full_url: paths.full,
  };
}

export function collectStoragePaths(img: {
  image_url?: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  full_url?: string | null;
}): string[] {
  return [
    ...new Set(
      [img.thumbnail_url, img.medium_url, img.full_url, img.image_url].filter(
        (p): p is string => !!p && !p.startsWith("http"),
      ),
    ),
  ];
}

export async function deleteProductImageFiles(img: {
  image_url?: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  full_url?: string | null;
}): Promise<void> {
  const paths = collectStoragePaths(img);
  if (!paths.length) return;
  const { error } = await supabase.storage.from("product-images").remove(paths);
  if (error) throw error;
}

/** Gallery picker — explicit MIME list for desktop + mobile albums. */
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

/** Camera capture — `image/*` + capture is required on many Android browsers to open the lens. */
export const PRODUCT_IMAGE_CAMERA_ACCEPT = "image/*";

/** Rear camera on phones/tablets; ignored on desktop file pickers. */
export const PRODUCT_IMAGE_CAMERA_CAPTURE = "environment" as const;

export function resetFileInput(input: HTMLInputElement | null): void {
  if (input) input.value = "";
}

/** Open a camera file input (reset first so repeat shots work). */
export function openCameraCapture(input: HTMLInputElement | null): void {
  if (!input) return;
  resetFileInput(input);
  requestAnimationFrame(() => input.click());
}

/** Open a gallery / multi-select file input. */
export function openGalleryPicker(input: HTMLInputElement | null): void {
  if (!input) return;
  resetFileInput(input);
  requestAnimationFrame(() => input.click());
}

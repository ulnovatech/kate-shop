/** Compact on mobile; 44px minimum touch targets from md up (Addendum A10). */
export const adminPrimaryTouch = "min-h-10 md:min-h-11";
export const adminIconTouch = "h-10 w-10 shrink-0 md:h-11 md:w-11";
/** Readable glyphs inside admin icon buttons (overrides Button default [&_svg]:size-4). */
export const adminIconButton = `${adminIconTouch} [&_svg]:!size-5 md:[&_svg]:!size-[1.375rem]`;
export const adminToolbarControl = "h-10 shrink-0 md:h-11";
export const adminFullWidthMobile = "w-full sm:w-auto";

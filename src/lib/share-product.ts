import { appToast } from "@/lib/app-toast";
import { absoluteUrl } from "@/lib/seo";
import { formatKES, whatsappUrl } from "@/lib/shop";
import { copyTextToClipboard } from "@/lib/clipboard";

export type ShareProductInput = {
  name: string;
  slug: string;
  price: number;
  shopName: string;
  whatsapp?: string;
  description?: string;
};

export type SharePlatform = "copy_link" | "whatsapp" | "x" | "facebook" | "instagram" | "snapchat";

export type ShareProductResult = "shared" | "copied" | "cancelled" | "failed";

export function buildProductShareUrl(slug: string): string {
  return absoluteUrl(`/product/${slug}`);
}

/** Short caption for social posts (no URL — platforms attach link separately). */
export function buildProductShareCaption(input: ShareProductInput): string {
  return `${input.name} — ${formatKES(input.price)} at ${input.shopName}`;
}

/** Full message for WhatsApp / paste-in-app (caption + link). */
export function buildProductShareText(input: ShareProductInput): string {
  const url = buildProductShareUrl(input.slug);
  return `${buildProductShareCaption(input)}\n${url}`;
}

export function buildProductWhatsAppShareUrl(input: ShareProductInput): string {
  return whatsappUrl(buildProductShareText(input), input.whatsapp ?? "");
}

export function buildTwitterShareUrl(input: ShareProductInput): string {
  const url = buildProductShareUrl(input.slug);
  const text = buildProductShareCaption(input);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function buildFacebookShareUrl(slug: string): string {
  const url = buildProductShareUrl(slug);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export async function shareProduct(input: ShareProductInput): Promise<ShareProductResult> {
  const url = buildProductShareUrl(input.slug);
  const priceLabel = formatKES(input.price);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: input.name,
        text: `${input.name} — ${priceLabel} at ${input.shopName}`,
        url,
      });
      return "shared";
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
    }
  }

  const copied = await copyTextToClipboard(url);
  return copied ? "copied" : "failed";
}

export async function shareProductWithFeedback(
  input: ShareProductInput,
  options?: { onWhatsApp?: () => void },
): Promise<void> {
  const result = await shareProduct(input);

  if (result === "shared") {
    appToast.success("Shared");
    return;
  }
  if (result === "copied") {
    appToast.success("Link copied to clipboard");
    return;
  }
  if (result === "cancelled") return;

  appToast.recoverableError("Could not share", {
    action: input.whatsapp
      ? {
          label: "WhatsApp",
          onClick: () => {
            window.open(buildProductWhatsAppShareUrl(input), "_blank", "noopener,noreferrer");
            options?.onWhatsApp?.();
          },
        }
      : undefined,
  });
}

export type SharePlatformAction = {
  ok: boolean;
  toastMessage: string;
  closeSheet?: boolean;
};

export async function executeSharePlatform(
  platform: SharePlatform,
  input: ShareProductInput,
): Promise<SharePlatformAction> {
  const url = buildProductShareUrl(input.slug);
  const fullText = buildProductShareText(input);

  switch (platform) {
    case "copy_link": {
      const ok = await copyTextToClipboard(url);
      return {
        ok,
        toastMessage: ok ? "Link copied" : "Could not copy link",
        closeSheet: ok,
      };
    }
    case "whatsapp": {
      window.open(buildProductWhatsAppShareUrl(input), "_blank", "noopener,noreferrer");
      return { ok: true, toastMessage: "Opening WhatsApp…", closeSheet: true };
    }
    case "x": {
      window.open(
        buildTwitterShareUrl(input),
        "_blank",
        "noopener,noreferrer,width=550,height=420",
      );
      return { ok: true, toastMessage: "Opening X…", closeSheet: true };
    }
    case "facebook": {
      window.open(
        buildFacebookShareUrl(input.slug),
        "_blank",
        "noopener,noreferrer,width=580,height=480",
      );
      return { ok: true, toastMessage: "Opening Facebook…", closeSheet: true };
    }
    case "instagram": {
      const ok = await copyTextToClipboard(fullText);
      return {
        ok,
        toastMessage: ok
          ? "Copied — paste in Instagram (Stories, DM, or bio link)"
          : "Could not copy",
        closeSheet: ok,
      };
    }
    case "snapchat": {
      const ok = await copyTextToClipboard(fullText);
      return {
        ok,
        toastMessage: ok ? "Copied — paste in Snapchat chat" : "Could not copy",
        closeSheet: ok,
      };
    }
    default:
      return { ok: false, toastMessage: "Unknown platform" };
  }
}

export const SHARE_PLATFORMS: {
  id: SharePlatform;
  label: string;
  hint: string;
}[] = [
  { id: "copy_link", label: "Copy link", hint: "Product URL" },
  { id: "whatsapp", label: "WhatsApp", hint: "Message with image text + link" },
  { id: "x", label: "X", hint: "Post with link preview" },
  { id: "facebook", label: "Facebook", hint: "Share link preview" },
  { id: "instagram", label: "Instagram", hint: "Copy caption to paste" },
  { id: "snapchat", label: "Snapchat", hint: "Copy caption to paste" },
];

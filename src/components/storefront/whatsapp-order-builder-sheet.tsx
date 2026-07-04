import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, Copy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appToast } from "@/lib/app-toast";
import { copyTextToClipboard } from "@/lib/clipboard";
import { loadCheckoutAutofill, saveCheckoutAutofill } from "@/lib/checkout-autofill";
import { hapticPointerProps, triggerHaptic } from "@/lib/haptics";
import { isValidUgandaPhone } from "@/lib/phone";
import { formatKES, whatsappUrl } from "@/lib/shop";
import {
  buildWhatsAppInquiryMessage,
  inquirySubtotal,
  type WhatsAppInquiryItem,
} from "@/lib/whatsapp-order-builder";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "items", label: "Items" },
  { id: "details", label: "Your details" },
  { id: "preview", label: "Preview" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const detailsSchema = z.object({
  customer_name: z.string().trim().min(2, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .refine(isValidUgandaPhone, "Enter a valid Uganda mobile number"),
  delivery_area: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

export type WhatsAppOrderBuilderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WhatsAppInquiryItem[];
  shopName: string;
  whatsapp: string;
};

export function WhatsAppOrderBuilderSheet({
  open,
  onOpenChange,
  items,
  shopName,
  whatsapp,
}: WhatsAppOrderBuilderSheetProps) {
  const [step, setStep] = useState<StepId>("items");
  const subtotal = useMemo(() => inquirySubtotal(items), [items]);

  const form = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      delivery_area: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setStep("items");
      return;
    }
    const saved = loadCheckoutAutofill();
    form.reset({
      customer_name: saved.customer_name ?? "",
      phone: saved.phone ?? "",
      delivery_area: saved.area ?? "",
      address: saved.address ?? "",
      notes: "",
    });
  }, [open, form]);

  const watched = form.watch();

  const previewMessage = useMemo(() => {
    if (!watched.customer_name || !watched.phone) return "";
    return buildWhatsAppInquiryMessage(
      {
        customerName: watched.customer_name,
        phone: watched.phone,
        deliveryArea: watched.delivery_area,
        address: watched.address,
        notes: watched.notes,
        items,
      },
      shopName,
    );
  }, [watched, items, shopName]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const goDetails = () => {
    if (items.length === 0) {
      appToast.recoverableError("Add items to your cart first.");
      return;
    }
    setStep("details");
  };

  const goPreview = async () => {
    const ok = await form.trigger();
    if (!ok) return;
    const values = form.getValues();
    saveCheckoutAutofill({
      customer_name: values.customer_name,
      phone: values.phone,
      email: "",
      area: values.delivery_area ?? "",
      address: values.address ?? "",
    });
    setStep("preview");
  };

  const sendWhatsApp = () => {
    const values = form.getValues();
    const message = buildWhatsAppInquiryMessage(
      {
        customerName: values.customer_name,
        phone: values.phone,
        deliveryArea: values.delivery_area,
        address: values.address,
        notes: values.notes,
        items,
      },
      shopName,
    );
    triggerHaptic("success");
    window.open(whatsappUrl(message, whatsapp), "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const copyMessage = async () => {
    const values = form.getValues();
    const message = buildWhatsAppInquiryMessage(
      {
        customerName: values.customer_name,
        phone: values.phone,
        deliveryArea: values.delivery_area,
        address: values.address,
        notes: values.notes,
        items,
      },
      shopName,
    );
    const ok = await copyTextToClipboard(message);
    if (ok) {
      triggerHaptic("light");
      appToast.success("Message copied");
    } else {
      appToast.recoverableError("Could not copy message");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[min(92vh,720px)] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading">Order on WhatsApp</SheetTitle>
          <SheetDescription>
            Review your items, add your details, then send the message to {shopName}.
          </SheetDescription>
        </SheetHeader>

        <ol className="mt-4 flex gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                "flex-1 rounded-full py-1 text-center text-[11px] font-medium",
                i <= stepIndex
                  ? "bg-gold/15 text-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {s.label}
            </li>
          ))}
        </ol>

        {step === "items" ? (
          <div className="mt-6 space-y-4">
            <ul className="space-y-3 text-sm">
              {items.map((item, idx) => (
                <li key={`${item.name}-${idx}`} className="flex justify-between gap-3">
                  <span>
                    {item.name}
                    {item.sku ? (
                      <span className="block text-xs text-muted-foreground">SKU {item.sku}</span>
                    ) : null}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatKES(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-3 text-sm font-semibold">
              <span>Subtotal</span>
              <span className="text-primary">{formatKES(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery fee will be confirmed on WhatsApp.
            </p>
            <Button type="button" className="w-full" size="lg" onClick={goDetails}>
              Continue
            </Button>
          </div>
        ) : null}

        {step === "details" ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void goPreview();
            }}
          >
            <div>
              <Label htmlFor="wa-customer-name">Your name</Label>
              <Input id="wa-customer-name" className="mt-1.5" {...form.register("customer_name")} />
              {form.formState.errors.customer_name ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.customer_name.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="wa-phone">Phone</Label>
              <Input id="wa-phone" className="mt-1.5" {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="wa-area">Delivery area (optional)</Label>
              <Input id="wa-area" className="mt-1.5" {...form.register("delivery_area")} />
            </div>
            <div>
              <Label htmlFor="wa-address">Address (optional)</Label>
              <Input id="wa-address" className="mt-1.5" {...form.register("address")} />
            </div>
            <div>
              <Label htmlFor="wa-notes">Notes (optional)</Label>
              <Textarea id="wa-notes" rows={2} className="mt-1.5" {...form.register("notes")} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("items")}>
                Back
              </Button>
              <Button type="submit" className="flex-1" size="lg">
                Preview message
              </Button>
            </div>
          </form>
        ) : null}

        {step === "preview" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border bg-secondary/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Message preview
              </p>
              <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {previewMessage}
              </pre>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button type="button" variant="outline" onClick={() => void copyMessage()}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#25D366] text-white hover:bg-[#25D366]/90"
                size="lg"
                onClick={sendWhatsApp}
                {...hapticPointerProps("medium")}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Send on WhatsApp
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

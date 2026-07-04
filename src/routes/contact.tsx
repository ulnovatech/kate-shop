import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { ShopLayout } from "@/components/shop-layout";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/shop";
import { useStoreBranding } from "@/lib/store-branding-context";
import { getSiteSeoDefaults } from "@/lib/api/seo.server";
import { buildPageHead, defaultSiteTitle } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  loader: () => getSiteSeoDefaults(),
  head: ({ loaderData }) => {
    const seo = loaderData ?? {
      contactDescription: "Contact us",
      branding: { shopName: "Store", tagline: "" },
    };
    return buildPageHead({
      title: defaultSiteTitle("Contact", seo.branding),
      description: seo.contactDescription,
      path: "/contact",
    });
  },
  component: Contact,
});

function Contact() {
  const { shopName, phone, whatsapp, email, address } = useStoreBranding();

  return (
    <ShopLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Contact</span>
        <h1 className="mt-2 font-heading text-4xl font-semibold md:text-5xl">Get in touch</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Reach {shopName} on WhatsApp, phone, or email.
        </p>
        <div className="gold-divider mt-8" />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <a
            href={whatsappUrl(`Hello ${shopName}!`, whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-4 rounded-md border bg-card p-6 transition-all hover:border-gold hover:shadow-md"
          >
            <MessageCircle className="h-6 w-6 text-gold" />
            <div>
              <h3 className="font-heading font-semibold">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">+{whatsapp}</p>
              <p className="mt-1 text-xs text-primary group-hover:underline">Chat now →</p>
            </div>
          </a>
          <a
            href={`tel:${phone}`}
            className="group flex items-start gap-4 rounded-md border bg-card p-6 transition-all hover:border-gold hover:shadow-md"
          >
            <Phone className="h-6 w-6 text-gold" />
            <div>
              <h3 className="font-heading font-semibold">Phone</h3>
              <p className="text-sm text-muted-foreground">{phone}</p>
            </div>
          </a>
          <a
            href={`mailto:${email}`}
            className="group flex items-start gap-4 rounded-md border bg-card p-6 transition-all hover:border-gold hover:shadow-md"
          >
            <Mail className="h-6 w-6 text-gold" />
            <div>
              <h3 className="font-heading font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </a>
          <div className="flex items-start gap-4 rounded-md border bg-card p-6">
            <MapPin className="h-6 w-6 text-gold" />
            <div>
              <h3 className="font-heading font-semibold">Location</h3>
              <p className="text-sm text-muted-foreground">{address}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
            <a href={whatsappUrl(`Hello ${shopName}!`, whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Message us on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </ShopLayout>
  );
}

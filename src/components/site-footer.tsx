import { Link } from "@tanstack/react-router";
import { Instagram, Phone, Mail } from "lucide-react";
import { useStoreBranding } from "@/lib/store-branding-context";
import { footerTagline } from "@/lib/store-branding";
import { whatsappUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  const branding = useStoreBranding();
  const { shopName, phone, whatsapp, email, instagram, tiktok, facebook } = branding;
  const tagline = footerTagline(branding);

  return (
    <footer className={cn("mt-24 border-t bg-emerald-deep text-cream", className)}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <h3 className="font-heading text-2xl font-semibold text-gold">{shopName}</h3>
          <p className="mt-3 max-w-xs text-sm text-cream/75">{tagline}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/shop" className="hover:text-gold">
                All Products
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">Reach us</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {phone}
            </li>
            <li>
              <a
                href={whatsappUrl(`Hello ${shopName}, I'd like to make an inquiry.`, whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold"
              >
                WhatsApp us
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {email}
            </li>
            {(instagram || tiktok || facebook) && (
              <li className="flex items-center gap-3 pt-2">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="hover:text-gold"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-cream/60 sm:px-6">
          © {new Date().getFullYear()} {shopName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

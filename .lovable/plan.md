# Kate Jewels — V1 Build Plan

A luxurious emerald + gold jewelry shop with a dynamic admin and lightweight ordering (WhatsApp + on-site form).

## Design Direction
- **Palette**: Emerald Prestige — deep emerald `#064e3b`, emerald `#0d7a5f`, gold `#c9a84c`, cream `#f5f0e0`
- **Typography**: Outfit (headings), Figtree (body) via @fontsource
- **Feel**: Editorial luxury jeweler — generous whitespace, large product photography, gold hairline dividers, subtle hover lifts, soft fade-ins on scroll
- **Shop name**: Kate Jewels · WhatsApp: +254 770 486 217

## Pages & Routes

### Storefront
- `/` Home — hero, featured products, 5 category tiles (Earrings, Necklaces, Watches, Bangles, Rings), WhatsApp CTA
- `/shop` Catalog — grid, category filter, search, pagination
- `/product/:slug` Product details — gallery, info, qty, Add to Cart + Order on WhatsApp
- `/cart` Cart — items, totals, two checkout buttons (WhatsApp / On-site form)
- `/checkout` On-site order form (name, phone, address, notes) → saves to DB
- `/contact` WhatsApp, phone, email, location, contact form
- Sticky header with cart count, mobile drawer nav

### Admin (`/admin/*`, protected)
- `/admin/login`
- `/admin` Dashboard — totals (products, in-stock, out-of-stock, categories, recent orders)
- `/admin/products` List, search, toggle visibility/stock, edit, soft delete
- `/admin/products/new` & `/admin/products/:id/edit` — full form, multi-image upload + reorder
- `/admin/categories` CRUD
- `/admin/orders` On-site orders list with status (Pending / Confirmed / Delivered)
- `/admin/settings` Shop info, WhatsApp, hero text, social links

## Backend (Lovable Cloud)

### Tables
- `categories` (id, name, slug, sort_order)
- `products` (id, name, slug, description, material, category_id, price, sku, stock_quantity, is_visible, is_active, created_at)
- `product_images` (id, product_id, image_url, sort_order)
- `orders` (id, customer_name, phone, address, notes, total, status, created_at)
- `order_items` (id, order_id, product_id, name, price, quantity)
- `settings` (singleton: shop_name, phone, whatsapp, email, address, hero_title, hero_subtitle, instagram, tiktok, facebook)
- `user_roles` (id, user_id, role) + `has_role()` security-definer fn + `app_role` enum (`admin`)

### Storage
- Public bucket `product-images` for product photos

### Security
- RLS on all tables
- Public read on `categories`, `products` (where visible+active), `product_images`, `settings`
- Public insert on `orders` and `order_items` (customer checkout)
- Admin-only (`has_role(auth.uid(),'admin')`) for all writes and order management
- Admin login via Lovable Cloud email/password (auto-confirm). Roles in `user_roles` table — never on profiles. First admin seeded by user signing up then a manual role insert.

### Cart
- Client-side (localStorage, Zustand). No customer accounts.

### WhatsApp ordering
- Generates prefilled `https://wa.me/254770486217?text=...` with product/cart summary

## Out of Scope (V2)
Payments, customer accounts, reviews, wishlists, analytics, advanced filters, coupons, shipping, email marketing.

## Technical Notes
- Stack: existing Vite + React + Tailwind + shadcn template
- State: TanStack Query for server data, Zustand for cart
- Forms: react-hook-form + zod
- Fonts: `bun add @fontsource/outfit @fontsource/figtree`, import in `main.tsx`, wire in `tailwind.config.ts`
- Design tokens in `index.css` (HSL) + `tailwind.config.ts`; all components reference tokens
- Image uploads via Supabase Storage with client-side resize before upload
- After build, user must sign up once at `/admin/login` then we'll insert their admin role via SQL

```text
Storefront         Admin              Cloud
-----------        -----------        --------------
Home               Login              auth.users
Shop  ────────►    Dashboard          user_roles (admin)
Product            Products CRUD ──►  products + images
Cart ─► WhatsApp                      categories
     └► Checkout ──────────────────►  orders + order_items
Contact            Settings ───────►  settings
                   Orders ◄───────────┘
```

Ready to build on approval.
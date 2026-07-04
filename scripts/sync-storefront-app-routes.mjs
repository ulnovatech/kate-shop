#!/usr/bin/env node
/**
 * Copy monolith shop routes into apps/storefront (C5).
 * Run after editing storefront routes in src/routes/: npm run sync:storefront-routes
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoutes = path.join(root, "src", "routes");
const destRoot = path.join(root, "apps", "storefront", "src", "routes");

const ROUTE_FILES = [
  "index.tsx",
  "shop.tsx",
  "product.$slug.tsx",
  "cart.tsx",
  "checkout.tsx",
  "orders.tsx",
  "order.$reference.tsx",
  "wishlist.tsx",
  "contact.tsx",
  "account.index.tsx",
  "account.login.tsx",
  "account.signup.tsx",
  "manifest[.]webmanifest.ts",
  "sitemap[.]xml.ts",
  "robots[.]txt.ts",
  "health[.]json.ts",
];

fs.mkdirSync(destRoot, { recursive: true });

for (const name of ROUTE_FILES) {
  const srcPath = path.join(srcRoutes, name);
  const destPath = path.join(destRoot, name);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log("synced", name);
}

console.log("Storefront routes synced (edit apps/storefront/src/routes/__root.tsx separately).");

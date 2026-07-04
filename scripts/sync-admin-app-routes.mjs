#!/usr/bin/env node
/**
 * Copy monolith admin routes into apps/admin (C3).
 * Run after editing src/routes/admin*.tsx: npm run sync:admin-routes
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoutes = path.join(root, "src", "routes");
const destRoot = path.join(root, "apps", "admin", "src", "routes", "_staff");

const ROUTE_MAP = [
  ["admin.tsx", "route.tsx"],
  ["admin.index.tsx", "index.tsx"],
  ["admin.login.tsx", "login.tsx"],
  ["admin.login-callback.tsx", "login-callback.tsx"],
  ["admin.setup.tsx", "setup.tsx"],
  ["admin.accept-invite.tsx", "accept-invite.tsx"],
  ["admin.insights.tsx", "insights.tsx"],
  ["admin.orders.tsx", "orders.tsx"],
  ["admin.orders.$id.tsx", "orders.$id.tsx"],
  ["admin.delivery.tsx", "delivery.tsx"],
  ["admin.products.index.tsx", "products/index.tsx"],
  ["admin.products.new.tsx", "products/new.tsx"],
  ["admin.products.$id.tsx", "products/$id.tsx"],
  ["admin.inventory.tsx", "inventory.tsx"],
  ["admin.categories.tsx", "categories.tsx"],
  ["admin.payments.tsx", "payments.tsx"],
  ["admin.payment-methods.tsx", "payment-methods.tsx"],
  ["admin.notifications.tsx", "notifications.tsx"],
  ["admin.recycle.tsx", "recycle.tsx"],
  ["admin.audit.tsx", "audit.tsx"],
  ["admin.team.tsx", "team.tsx"],
  ["admin.roles.tsx", "roles.tsx"],
  ["admin.settings.tsx", "settings.tsx"],
];

function transform(content, destFile) {
  let s = content;

  s = s.replace(/createFileRoute\("\/admin\/"\)/g, 'createFileRoute("/_staff/")');
  s = s.replace(/createFileRoute\("\/admin([^"]*)"\)/g, 'createFileRoute("/_staff$1")');

  s = s.replace(/to="\/admin\//g, 'to="/');
  s = s.replace(/to="\/admin"/g, 'to="/"');
  s = s.replace(/to: "\/admin\//g, 'to: "/');
  s = s.replace(/to: "\/admin"/g, 'to: "/"');

  s = s.replace(/navigate\(\{ to: "\/admin\//g, 'navigate({ to: "/');
  s = s.replace(/navigate\(\{ to: "\/admin",/g, 'navigate({ to: "/",');

  s = s.replace(
    /const navigate = useNavigate\(\{ from: "\/admin[^"]*"\s*\}\);/g,
    "const navigate = Route.useNavigate();",
  );
  s = s.replace(/import \{ createFileRoute, useNavigate \}/g, "import { createFileRoute }");
  s = s.replace(/import \{ useNavigate, createFileRoute \}/g, "import { createFileRoute }");

  if (destFile === "route.tsx") {
    s = s.replace(/\/admin-manifest\.webmanifest/g, "/manifest.webmanifest");
  }

  return s;
}

fs.mkdirSync(destRoot, { recursive: true });

for (const [srcName, destRel] of ROUTE_MAP) {
  const srcPath = path.join(srcRoutes, srcName);
  const destPath = path.join(destRoot, destRel);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const raw = fs.readFileSync(srcPath, "utf8");
  fs.writeFileSync(destPath, transform(raw, destRel));
  console.log("synced", destRel);
}

const manifestSrc = path.join(srcRoutes, "admin-manifest[.]webmanifest.ts");
const manifestDest = path.join(root, "apps", "admin", "src", "routes", "manifest[.]webmanifest.ts");
let manifest = fs.readFileSync(manifestSrc, "utf8");
manifest = manifest.replace(
  'createFileRoute("/admin-manifest.webmanifest")',
  'createFileRoute("/manifest.webmanifest")',
);
fs.writeFileSync(manifestDest, manifest);
console.log("synced manifest[.]webmanifest.ts");

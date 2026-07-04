#!/usr/bin/env node
/**
 * Prints admin route files and @/lib/api imports for blueprint audits.
 * Run: npm run audit:admin
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routesDir = path.join(root, "src", "routes");
const componentsDir = path.join(root, "src", "components");

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full, pred));
    else if (pred(full)) out.push(full);
  }
  return out;
}

const adminRoutes = fs
  .readdirSync(routesDir)
  .filter((f) => f.startsWith("admin.") && f.endsWith(".tsx"))
  .sort();

const adminComponents = walk(componentsDir, (f) => /admin/i.test(path.relative(componentsDir, f)));

const apiImports = new Map();
for (const file of adminRoutes.map((f) => path.join(routesDir, f))) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/from ["']@\/lib\/api\/([^"']+)["']/g)) {
    const mod = m[1];
    if (!apiImports.has(mod)) apiImports.set(mod, []);
    apiImports.get(mod).push(path.basename(file));
  }
}

console.log("Kate Admin dependency audit\n");
console.log(`Admin routes (${adminRoutes.length}):`);
for (const r of adminRoutes) console.log(`  - src/routes/${r}`);

console.log(`\nAdmin-related components (${adminComponents.length}):`);
for (const c of adminComponents.sort()) console.log(`  - ${path.relative(root, c)}`);

console.log("\n@/lib/api imports from admin routes:");
for (const [mod, files] of [...apiImports.entries()].sort()) {
  console.log(`  - ${mod}  ← ${files.join(", ")}`);
}

console.log("\nAlso used by admin: product-form.tsx, loading-states, src/lib/auth.tsx");
console.log("Full write-up: docs/ADMIN_DEPENDENCY_AUDIT.md\n");

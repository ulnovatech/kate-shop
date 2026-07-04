#!/usr/bin/env node
/**
 * C4 — copy shared modules into packages/* and leave re-export shims in src/.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, transform) {
  ensureDir(path.dirname(dest));
  let text = fs.readFileSync(src, "utf8");
  if (transform) text = transform(text);
  fs.writeFileSync(dest, text);
}

function shim(srcFile, exportPath) {
  const shimContent = `/** C4 shim — implementation in ${exportPath} */\nexport * from "${exportPath}";\n`;
  fs.writeFileSync(srcFile, shimContent);
}

const DOMAIN_FILES = [
  ["src/lib/db/contracts.ts", "packages/domain/src/db/contracts.ts"],
  ["src/lib/permissions.ts", "packages/domain/src/permissions.ts"],
  ["src/lib/admin-base-path.ts", "packages/domain/src/admin-base-path.ts"],
  ["src/lib/admin-routes.ts", "packages/domain/src/admin-routes.ts"],
  ["src/lib/rbac.ts", "packages/domain/src/rbac.ts"],
  ["src/lib/phone.ts", "packages/domain/src/phone.ts"],
  ["src/lib/errors.ts", "packages/domain/src/errors.ts"],
  ["src/lib/human-labels.ts", "packages/domain/src/human-labels.ts"],
  ["src/lib/categories.ts", "packages/domain/src/categories.ts"],
];

function rewriteDomain(text) {
  let s = text
    .replaceAll("@/lib/db/contracts", "@kate/domain/db/contracts")
    .replaceAll("@/lib/permissions", "@kate/domain/permissions")
    .replaceAll("@/lib/admin-base-path", "@kate/domain/admin-base-path")
    .replaceAll("@/lib/admin-routes", "@kate/domain/admin-routes")
    .replaceAll("@/lib/rbac", "@kate/domain/rbac")
    .replaceAll('from "@/lib/permissions.server"', 'from "./permissions"')
    .replaceAll('from "@kate/domain/permissions"', 'from "./permissions"');

  s = s.replaceAll("@kate/domain/db/contracts", "./db/contracts");
  s = s.replaceAll("@kate/domain/permissions", "./permissions");
  s = s.replaceAll("@kate/domain/admin-base-path", "./admin-base-path");
  s = s.replaceAll("@kate/domain/admin-routes", "./admin-routes");
  s = s.replaceAll("@kate/domain/rbac", "./rbac");
  return s;
}

for (const [src, dest] of DOMAIN_FILES) {
  copyFile(path.join(root, src), path.join(root, dest), rewriteDomain);
  shim(
    path.join(root, src),
    `@kate/domain/${path.relative(path.join(root, "packages/domain/src"), path.join(root, dest)).replace(/\\/g, "/").replace(/\.ts$/, "")}`,
  );
}

// permissions: add staffAccessToLegacyRole before extract re-run - handled in source first

const SUPABASE_FILES = [
  ["src/lib/supabase-env.ts", "packages/supabase/src/env.ts"],
  ["src/integrations/supabase/types.ts", "packages/supabase/src/types.ts"],
  ["src/integrations/supabase/client.ts", "packages/supabase/src/client.ts"],
  ["src/integrations/supabase/client.server.ts", "packages/supabase/src/client.server.ts"],
  ["src/integrations/supabase/auth-middleware.ts", "packages/supabase/src/auth-middleware.ts"],
  ["src/integrations/supabase/auth-attacher.ts", "packages/supabase/src/auth-attacher.ts"],
];

function rewriteSupabase(text) {
  return text
    .replaceAll("@/lib/supabase-env", "./env")
    .replaceAll('from "./types"', 'from "./types"')
    .replaceAll('from "./client"', 'from "./client"');
}

for (const [src, dest] of SUPABASE_FILES) {
  copyFile(path.join(root, src), path.join(root, dest), rewriteSupabase);
  const exportName = path.basename(dest, ".ts");
  if (src.includes("integrations")) {
    shim(path.join(root, src), `@kate/supabase/${exportName}`);
  } else {
    shim(path.join(root, src), `@kate/supabase/env`);
  }
}

// UI
const uiSrc = path.join(root, "src/components/ui");
const uiDest = path.join(root, "packages/ui/src/components");
ensureDir(uiDest);
for (const name of fs.readdirSync(uiSrc)) {
  copyFile(path.join(uiSrc, name), path.join(uiDest, name), (t) =>
    t.replaceAll("@/lib/utils", "@kate/ui/utils"),
  );
  shim(path.join(uiSrc, name), `@kate/ui/components/${name.replace(/\.tsx$/, "")}`);
}
copyFile(path.join(root, "src/lib/utils.ts"), path.join(root, "packages/ui/src/utils.ts"));
shim(path.join(root, "src/lib/utils.ts"), "@kate/ui/utils");

// API
const apiSrc = path.join(root, "src/lib/api");
const apiDest = path.join(root, "packages/api/src");
ensureDir(apiDest);
ensureDir(path.join(apiDest, "server"));

copyFile(
  path.join(root, "src/lib/permissions.server.ts"),
  path.join(apiDest, "server/permissions.server.ts"),
  (t) =>
    t
      .replaceAll("@/integrations/supabase/client.server", "@kate/supabase/client.server")
      .replaceAll("@/lib/permissions", "@kate/domain/permissions")
      .replaceAll("@/lib/db/contracts", "@kate/domain/db/contracts")
      .replaceAll("@/lib/rbac", "@kate/domain/rbac"),
);
shim(path.join(root, "src/lib/permissions.server.ts"), "@kate/api/server/permissions.server");

for (const name of fs.readdirSync(apiSrc)) {
  const src = path.join(apiSrc, name);
  if (!name.endsWith(".ts")) continue;
  copyFile(src, path.join(apiDest, name), (t) =>
    t
      .replaceAll("@/integrations/supabase/client.server", "@kate/supabase/client.server")
      .replaceAll("@/integrations/supabase/auth-middleware", "@kate/supabase/auth-middleware")
      .replaceAll("@/lib/db/contracts", "@kate/domain/db/contracts")
      .replaceAll("@/lib/rbac", "@kate/domain/rbac")
      .replaceAll("@/lib/permissions.server", "@kate/api/server/permissions.server")
      .replaceAll("@/lib/permissions", "@kate/domain/permissions")
      .replaceAll(/@\/lib\/api\/([^"']+)/g, "@kate/api/$1"),
  );
  shim(src, `@kate/api/${name.replace(/\.ts$/, "")}`);
}

console.log("C4 extract complete — packages populated, src shims written.");

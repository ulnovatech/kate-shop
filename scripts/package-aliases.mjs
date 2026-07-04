import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Vite / Vitest aliases for C4 workspace packages. */
export function katePackageAliases() {
  return {
    "@kate/domain": path.resolve(repoRoot, "packages/domain/src"),
    "@kate/supabase": path.resolve(repoRoot, "packages/supabase/src"),
    "@kate/ui": path.resolve(repoRoot, "packages/ui/src"),
    "@kate/api": path.resolve(repoRoot, "packages/api/src"),
  };
}

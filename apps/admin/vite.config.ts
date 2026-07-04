import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { katePackageAliases } from "../../scripts/package-aliases.mjs";
import { loadEnv } from "../../scripts/load-env.mjs";

loadEnv();

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoSrc = path.resolve(appDir, "../../src");

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@": repoSrc,
        ...katePackageAliases(),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      host: true,
      headers: {
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' ws: wss: http: https:; worker-src 'self' blob:;",
      },
    },
    envDir: "../..",
    publicDir: path.resolve(appDir, "public"),
    define: {
      "import.meta.env.VITE_ADMIN_BASE_PATH": JSON.stringify("/"),
      "import.meta.env.VITE_STAFF_PUSH_NATIVE": JSON.stringify(
        process.env.VITE_STAFF_PUSH_NATIVE ?? "false",
      ),
      "import.meta.env.VITE_ADMIN_ORIGIN": JSON.stringify(
        process.env.VITE_ADMIN_ORIGIN ?? process.env.ADMIN_ORIGIN ?? "http://localhost:5174",
      ),
      "import.meta.env.VITE_APP_ORIGIN": JSON.stringify(
        process.env.VITE_APP_ORIGIN ?? process.env.APP_ORIGIN ?? "http://localhost:5173",
      ),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: true,
});

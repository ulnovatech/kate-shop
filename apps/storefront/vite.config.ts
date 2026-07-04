import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
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
      port: 5173,
      strictPort: true,
    },
    envDir: "../..",
    define: {
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
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: false,
      includeAssets: ["pwa-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff,webmanifest}"],
        globIgnores: ["**/admin-routes-*.js", "**/admin-ui-*.js"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "product-images",
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});

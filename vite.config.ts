// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { katePackageAliases } from "./scripts/package-aliases.mjs";
import { loadEnv } from "./scripts/load-env.mjs";

loadEnv();

export default defineConfig({
  vite: {
    resolve: {
      alias: katePackageAliases(),
    },
    server: {
      // Monolith dev port — storefront standalone uses 5173; admin standalone uses 5174.
      port: Number(process.env.DEV_MONOLITH_PORT ?? 5175),
      strictPort: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("src/routes/admin.") || id.includes("src\\routes\\admin.")) {
              return "admin-routes";
            }
            if (id.includes("src/components/admin") || id.includes("src\\components\\admin")) {
              return "admin-ui";
            }
          },
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Chunk 17 — enable Nitro deploy output (Cloudflare Workers default) outside Lovable sandbox.
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

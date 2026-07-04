import type { CapacitorConfig } from "@capacitor/cli";
import { resolveAdminMobileServerUrl } from "../../scripts/resolve-admin-mobile-url.mjs";

const serverUrl = resolveAdminMobileServerUrl();
const isLocalHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.kate.admin",
  appName: "Kate Admin",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: isLocalHttp,
    androidScheme: isLocalHttp ? "http" : "https",
  },
  android: {
    allowMixedContent: isLocalHttp,
  },
};

export default config;

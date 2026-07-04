#!/usr/bin/env node
/** Print Supabase Authentication redirect URLs for production (C6/C8). */
import { staffAuthRedirectUrls } from "@kate/api/staff-urls";

const siteUrl = process.env.APP_ORIGIN?.trim();

console.log("Supabase → Authentication → URL configuration\n");
console.log("Site URL (recommended):");
console.log(`  ${siteUrl || "https://your-shop-domain.com"}\n`);

console.log("Redirect URLs (add each line):");
const redirects = staffAuthRedirectUrls();
if (redirects.length === 0) {
  console.log("  https://your-shop-domain.com/**");
  console.log("  https://admin.your-domain.com/**");
  console.log("  com.kate.admin://login-callback");
} else {
  for (const url of redirects) console.log(`  ${url}`);
}

console.log("\nRun with APP_ORIGIN and ADMIN_ORIGIN set to print your exact values.");

#!/usr/bin/env node
/**
 * Remote URL loaded by the Kate Admin Capacitor shell (C7).
 * Priority: ADMIN_MOBILE_SERVER_URL → VITE_ADMIN_ORIGIN → ADMIN_ORIGIN → local dev default.
 */

const LOCAL_DEFAULT = "http://localhost:5174";
const EMULATOR_HINT = "http://10.0.2.2:5174";

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function resolveAdminMobileServerUrl(env = process.env) {
  for (const key of ["ADMIN_MOBILE_SERVER_URL", "VITE_ADMIN_ORIGIN", "ADMIN_ORIGIN"]) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    try {
      return new URL(raw).href.replace(/\/$/, "");
    } catch {
      // ignore invalid URL
    }
  }
  return LOCAL_DEFAULT;
}

export { LOCAL_DEFAULT, EMULATOR_HINT };

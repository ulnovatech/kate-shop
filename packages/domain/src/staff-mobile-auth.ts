/** Kate Admin APK — Capacitor app id (C7/C8). */
export const STAFF_MOBILE_APP_ID = "com.kate.admin";

/** Deep link host for Supabase OAuth / magic-link return (C8). */
export const STAFF_MOBILE_AUTH_HOST = "login-callback";

/** Supabase redirect URL for the native staff app. */
export const STAFF_MOBILE_LOGIN_CALLBACK = `${STAFF_MOBILE_APP_ID}://${STAFF_MOBILE_AUTH_HOST}`;

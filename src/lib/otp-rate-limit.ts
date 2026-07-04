const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_PHONE = 5;
const MAX_VERIFY_ATTEMPTS_PER_PHONE = 10;
const MAX_REQUESTS_PER_STAFF_EMAIL = 5;
const MAX_VERIFY_ATTEMPTS_PER_STAFF_EMAIL = 10;

type Bucket = { count: number; windowStart: number };

const requestBuckets = new Map<string, Bucket>();
const verifyBuckets = new Map<string, Bucket>();
const staffEmailRequestBuckets = new Map<string, Bucket>();
const staffEmailVerifyBuckets = new Map<string, Bucket>();

function checkLimit(map: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    map.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

function staffEmailRateKey(email: string, purpose: string): string {
  return `${email.trim().toLowerCase()}:${purpose}`;
}

export function allowOtpRequest(phone: string): boolean {
  return checkLimit(requestBuckets, phone, MAX_REQUESTS_PER_PHONE);
}

export function allowOtpVerify(phone: string): boolean {
  return checkLimit(verifyBuckets, phone, MAX_VERIFY_ATTEMPTS_PER_PHONE);
}

export function allowStaffEmailOtpRequest(email: string, purpose: string): boolean {
  return checkLimit(
    staffEmailRequestBuckets,
    staffEmailRateKey(email, purpose),
    MAX_REQUESTS_PER_STAFF_EMAIL,
  );
}

export function allowStaffEmailOtpVerify(email: string, purpose: string): boolean {
  return checkLimit(
    staffEmailVerifyBuckets,
    staffEmailRateKey(email, purpose),
    MAX_VERIFY_ATTEMPTS_PER_STAFF_EMAIL,
  );
}

/** Test helper */
export function resetOtpRateLimits(): void {
  requestBuckets.clear();
  verifyBuckets.clear();
  staffEmailRequestBuckets.clear();
  staffEmailVerifyBuckets.clear();
}

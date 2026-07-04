/** Normalize Uganda mobile numbers to 256XXXXXXXXX (no +). */
export function normalizeUgandaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("256") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `256${digits}`;

  return null;
}

export function formatPhoneDisplay(normalized: string): string {
  if (normalized.startsWith("256") && normalized.length === 12) {
    return `0${normalized.slice(3)}`;
  }
  return normalized;
}

export function isValidUgandaPhone(input: string): boolean {
  return normalizeUgandaPhone(input) !== null;
}

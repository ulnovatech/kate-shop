/** Staff PIN length — must match staffPinSchema on the server. */
export const STAFF_PIN_LENGTH = 5;

export function isStaffPinComplete(pin: string): boolean {
  return new RegExp(`^\\d{${STAFF_PIN_LENGTH}}$`).test(pin);
}

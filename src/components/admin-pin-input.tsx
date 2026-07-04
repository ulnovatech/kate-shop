import { useContext, useEffect, useRef, useState } from "react";
import { OTPInputContext } from "input-otp";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { STAFF_PIN_LENGTH, isStaffPinComplete } from "@kate/api/staff-pin.shared";

export { isStaffPinComplete };

export const STAFF_PIN_REVEAL_MS = 500;

type AdminPinInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Called once when all digits are entered (re-fires after the value is cleared). */
  onComplete?: (pin: string) => void;
  slotClassName?: string;
};

function AdminPinOTPSlot({ index, className }: { index: number; className?: string }) {
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    if (!char) {
      setMasked(false);
      return;
    }
    setMasked(false);
    const timer = window.setTimeout(() => setMasked(true), STAFF_PIN_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [char]);

  const display = char && masked ? "•" : char;

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className,
      )}
    >
      {display}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      ) : null}
    </div>
  );
}

function usePinAutoComplete(
  value: string,
  onComplete: AdminPinInputProps["onComplete"],
  disabled?: boolean,
) {
  const lastSubmitted = useRef<string | null>(null);

  useEffect(() => {
    if (!onComplete || disabled) return;
    if (!isStaffPinComplete(value)) {
      lastSubmitted.current = null;
      return;
    }
    if (lastSubmitted.current === value) return;
    lastSubmitted.current = value;
    onComplete(value);
  }, [value, onComplete, disabled]);
}

/** Numeric 5-digit PIN entry for staff auth flows. */
export function AdminPinInput({
  id,
  value,
  onChange,
  disabled,
  onComplete,
  slotClassName,
}: AdminPinInputProps) {
  usePinAutoComplete(value, onComplete, disabled);

  return (
    <InputOTP
      id={id}
      maxLength={STAFF_PIN_LENGTH}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <InputOTPGroup>
        {Array.from({ length: STAFF_PIN_LENGTH }, (_, index) => (
          <AdminPinOTPSlot key={index} index={index} className={slotClassName} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

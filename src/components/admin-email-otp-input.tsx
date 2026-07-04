import { useEffect, useRef } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

type AdminEmailOtpInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Called once when all six digits are entered (re-fires after the value is cleared). */
  onComplete?: (code: string) => void;
};

/** Six-digit email passcode entry for staff verification flows. */
export function AdminEmailOtpInput({
  id,
  value,
  onChange,
  disabled,
  className,
  onComplete,
}: AdminEmailOtpInputProps) {
  const lastSubmitted = useRef<string | null>(null);

  useEffect(() => {
    if (!onComplete || disabled) return;
    if (!isStaffEmailOtpComplete(value)) {
      lastSubmitted.current = null;
      return;
    }
    if (lastSubmitted.current === value) return;
    lastSubmitted.current = value;
    onComplete(value);
  }, [value, onComplete, disabled]);

  return (
    <InputOTP
      id={id}
      maxLength={6}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      disabled={disabled}
      containerClassName={cn("justify-center", className)}
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="border-border bg-background"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

export function isStaffEmailOtpComplete(code: string): boolean {
  return /^\d{6}$/.test(code);
}

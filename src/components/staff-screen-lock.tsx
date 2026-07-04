import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminBrandMark } from "@/components/admin-brand-mark";
import { AdminPinInput } from "@/components/admin-pin-input";
import { StaffForgotPinFlow } from "@/components/staff-forgot-pin-flow";
import { verifyScreenLockPin } from "@/lib/api/auth.functions";
import { useAuth } from "@/lib/auth";
import { humanizeError } from "@/lib/errors";
import {
  clearStaffAppUnlock,
  isStaffAppUnlocked,
  markStaffAppUnlocked,
  staffScreenLockIdleMs,
} from "@/lib/staff-screen-lock";

type StaffScreenLockProviderProps = {
  enabled: boolean;
  children: ReactNode;
};

type ScreenLockView = "unlock" | "forgot-pin";

export function StaffScreenLockProvider({ enabled, children }: StaffScreenLockProviderProps) {
  const { user } = useAuth();
  const email = user?.email ?? "";

  const [locked, setLocked] = useState(false);
  const [view, setView] = useState<ScreenLockView>("unlock");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const lock = useCallback(() => {
    clearStaffAppUnlock();
    setLocked(true);
    setView("unlock");
    setPin("");
  }, []);

  const unlock = useCallback(() => {
    markStaffAppUnlocked();
    setLocked(false);
    setView("unlock");
    setPin("");
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLocked(false);
      return;
    }
    setLocked(!isStaffAppUnlocked());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lock();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, lock]);

  useEffect(() => {
    if (!enabled || locked) return;

    const idleMs = staffScreenLockIdleMs();
    let timer = window.setTimeout(lock, idleMs);

    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, idleMs);
    };

    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    for (const event of events) {
      window.addEventListener(event, bump, { passive: true });
    }

    return () => {
      window.clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, bump);
      }
    };
  }, [enabled, lock, locked]);

  useEffect(() => {
    if (!enabled) return;

    let removed: (() => void) | undefined;

    void import("@capacitor/core")
      .then(({ Capacitor }) => {
        if (!Capacitor.isNativePlatform()) return;
        return import("@capacitor/app").then(({ App }) =>
          App.addListener("appStateChange", ({ isActive }) => {
            if (!isActive) lock();
          }).then((handle) => {
            removed = () => void handle.remove();
          }),
        );
      })
      .catch(() => undefined);

    return () => removed?.();
  }, [enabled, lock]);

  const verifyPin = useCallback(
    async (pinValue: string) => {
      if (busy) return;

      setBusy(true);
      try {
        await verifyScreenLockPin({ data: { pin: pinValue } });
        unlock();
      } catch (e: unknown) {
        toast.error(humanizeError(e, { fallback: "Incorrect PIN." }));
        setPin("");
      } finally {
        setBusy(false);
      }
    },
    [busy, unlock],
  );

  const openForgotPin = () => {
    if (!email) {
      toast.error("Sign in again to reset your PIN.");
      return;
    }
    setView("forgot-pin");
    setPin("");
  };

  const onForgotPinSuccess = useCallback(() => {
    unlock();
  }, [unlock]);

  return (
    <>
      {children}
      {enabled && locked ? (
        <div
          className="fixed inset-0 z-[var(--z-modal,50)] flex items-center justify-center bg-sidebar px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-screen-lock-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-sidebar-border bg-sidebar p-6 text-sidebar-foreground shadow-overlay">
            <AdminBrandMark subtitle={view === "unlock" ? "Locked" : "Reset PIN"} />
            {view === "unlock" ? (
              <>
                <h2
                  id="staff-screen-lock-title"
                  className="mt-6 text-center font-heading text-lg font-semibold"
                >
                  Enter your PIN
                </h2>
                <p className="mt-1 text-center text-sm text-sidebar-foreground/70">
                  Confirm it is you to continue using Kate Admin.
                </p>
                <div className="mt-6 flex justify-center">
                  <AdminPinInput
                    id="screen-lock-pin"
                    value={pin}
                    onChange={setPin}
                    disabled={busy}
                    onComplete={(value) => void verifyPin(value)}
                    slotClassName="border-sidebar-border bg-sidebar"
                  />
                </div>
                {busy ? (
                  <p className="mt-4 flex items-center justify-center gap-2 text-sm text-sidebar-foreground/70">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Verifying…
                  </p>
                ) : (
                  <p className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={openForgotPin}
                      className="text-sm font-medium text-gold hover:underline"
                    >
                      Forgot PIN?
                    </button>
                  </p>
                )}
              </>
            ) : (
              <>
                <h2
                  id="staff-screen-lock-title"
                  className="mt-6 text-center font-heading text-lg font-semibold"
                >
                  Reset PIN
                </h2>
                <p className="mt-1 text-center text-sm text-sidebar-foreground/70">
                  We will email a verification code to set a new PIN.
                </p>
                <div className="mt-6">
                  <StaffForgotPinFlow
                    email={email}
                    autoSendCode
                    onSuccess={onForgotPinSuccess}
                    onCancel={() => setView("unlock")}
                    cancelLabel="Back to PIN entry"
                    fieldClassName="border-sidebar-border bg-sidebar text-sidebar-foreground"
                    pinSlotClassName="border-sidebar-border bg-sidebar"
                    mutedTextClassName="text-sidebar-foreground/70"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminPinInput, isStaffPinComplete } from "@/components/admin-pin-input";
import { completeBootstrap, getBootstrapStatus } from "@/lib/api/bootstrap.functions";
import {
  listPaymentMethodsAdmin,
  savePaymentMethods,
} from "@/lib/api/payment-methods.functions";
import { updateSettingsPartial } from "@/lib/api/settings.functions";
import { withTimeout } from "@/lib/with-timeout";
import { AuthCardSkeleton } from "@/components/loading-states";
import { useAdminShopName } from "@/components/admin-brand-mark";
import { humanizeError } from "@/lib/errors";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/lib/db/contracts";
import { PAYMENT_PROVIDER_LABELS } from "@/lib/payments";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { ADMIN_SETUP_COMPLETION_QUERY_KEY } from "@/lib/admin-setup-completion";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-base-path";
import { establishStaffPinSession, finishStaffSignIn } from "@/lib/staff-login";
import {
  clearStaffOnboardingOAuth,
  getGoogleOnboardingSession,
  loadStaffOnboardingOAuth,
  startStaffGoogleOnboarding,
} from "@/lib/staff-onboarding-oauth";
import { AdminAuthDivider, AdminGoogleAuthButton } from "./admin-google-auth-button";
import { useQueryClient } from "@tanstack/react-query";
import { AdminAuthLayout, ADMIN_AUTH_FIELD_CLASS } from "./admin-auth-layout";
import { AdminEmailVerifyStep } from "./admin-email-verify-step";
import { AdminOnboardingStepper } from "./admin-onboarding-stepper";
import { cn } from "@/lib/utils";

const SETUP_STEPS = [
  { id: "account", label: "Account" },
  { id: "verify-email", label: "Verify email" },
  { id: "store", label: "Store" },
  { id: "payments", label: "Payments" },
  { id: "pin", label: "PIN" },
] as const;

type SetupStepId = (typeof SETUP_STEPS)[number]["id"];

const accountSchema = z
  .object({
    email: z.string().trim().email("Valid email required"),
    password: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
    bootstrapToken: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const storeSchema = z.object({
  shop_name: z.string().trim().min(2, "Shop name is required"),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
}).refine((d) => (d.phone?.trim().length ?? 0) >= 7 || (d.whatsapp?.trim().length ?? 0) >= 9, {
  message: "Add a phone or WhatsApp number customers can reach you on",
  path: ["phone"],
});

type AccountForm = z.infer<typeof accountSchema>;
type StoreForm = z.infer<typeof storeSchema>;

export function SetupWizard() {
  const shopName = useAdminShopName();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [tokenRequired, setTokenRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<SetupStepId>("account");
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [oauthUserId, setOauthUserId] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [enabledProviders, setEnabledProviders] = useState<Set<PaymentProvider>>(
    () => new Set<PaymentProvider>(["mtn_momo", "cash_on_delivery"]),
  );

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", bootstrapToken: "" },
  });

  const storeForm = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { shop_name: "", phone: "", whatsapp: "" },
  });

  const ownerEmail = accountForm.watch("email").trim();

  useEffect(() => {
    withTimeout(getBootstrapStatus(), 6_000, "Setup check")
      .then((s) => {
        if (!s.required) {
          navigate({ to: ADMIN_LOGIN_PATH, replace: true });
          return;
        }
        setTokenRequired(s.tokenRequired);
      })
      .catch(() => toast.error("Could not check setup status"))
      .finally(() => setChecking(false));
  }, [navigate]);

  useEffect(() => {
    if (checking) return;
    void (async () => {
      const flow = loadStaffOnboardingOAuth();
      if (flow?.kind !== "bootstrap") return;

      const session = await getGoogleOnboardingSession();
      if (!session) return;

      accountForm.setValue("email", session.email);
      setOauthUserId(session.userId);
      if (flow.bootstrapToken) {
        accountForm.setValue("bootstrapToken", flow.bootstrapToken);
      }
      setStep("store");
    })();
  }, [checking, accountForm]);

  const stepIndex = SETUP_STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === SETUP_STEPS.length - 1;

  const toggleProvider = (provider: PaymentProvider, on: boolean) => {
    setEnabledProviders((prev) => {
      const next = new Set(prev);
      if (on) next.add(provider);
      else next.delete(provider);
      return next;
    });
  };

  const goNext = async () => {
    if (step === "account") {
      const valid = await accountForm.trigger();
      if (!valid) return;
      setEmailVerificationToken(null);
      setStep("verify-email");
      return;
    }
    if (step === "verify-email") {
      if (!emailVerificationToken) {
        toast.error("Verify your email before continuing.");
        return;
      }
      setStep("store");
      return;
    }
    if (step === "store") {
      const valid = await storeForm.trigger();
      if (!valid) return;
      setStep("payments");
      return;
    }
    if (step === "payments") {
      if (enabledProviders.size === 0) {
        toast.error("Enable at least one payment method.");
        return;
      }
      setStep("pin");
    }
  };

  const goBack = () => {
    const prev = SETUP_STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const onGoogleSetup = async () => {
    if (tokenRequired && !accountForm.getValues().bootstrapToken?.trim()) {
      toast.error("Enter the setup token first.");
      return;
    }

    setGoogleBusy(true);
    try {
      await startStaffGoogleOnboarding({
        kind: "bootstrap",
        bootstrapToken: accountForm.getValues().bootstrapToken?.trim() || undefined,
      });
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not start Google sign-in." }));
      setGoogleBusy(false);
    }
  };

  const finishSetup = async () => {
    if (!isStaffPinComplete(pin)) {
      toast.error("PIN must be 5 digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }
    if (!oauthUserId && !emailVerificationToken) {
      toast.error("Email verification expired. Go back and verify again.");
      setStep("verify-email");
      return;
    }

    const account = accountForm.getValues();
    const store = storeForm.getValues();

    setBusy(true);
    try {
      await completeBootstrap({
        data: {
          email: account.email,
          password: oauthUserId ? undefined : account.password,
          bootstrapToken: account.bootstrapToken || undefined,
          emailVerificationToken: oauthUserId ? undefined : emailVerificationToken ?? undefined,
          oauthUserId: oauthUserId ?? undefined,
          pin,
        },
      });

      if (!oauthUserId) {
        await establishStaffPinSession(account.email, pin);
      }

      await updateSettingsPartial({
        data: {
          shop_name: store.shop_name,
          phone: store.phone?.trim() ?? "",
          whatsapp: store.whatsapp?.trim() ?? "",
        },
      });

      const methods = await listPaymentMethodsAdmin();
      await savePaymentMethods({
        data: {
          methods: methods.map((m) => ({
            id: m.id,
            label: m.label,
            sort_order: m.sort_order,
            is_enabled: enabledProviders.has(m.provider),
          })),
        },
      });

      void qc.invalidateQueries({ queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: ["admin-shop-name"] });

      toast.success(`${store.shop_name} is ready. Welcome, owner.`);
      clearStaffOnboardingOAuth();
      await finishStaffSignIn(navigate);
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not complete setup." }));
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return <AuthCardSkeleton />;
  }

  const footer = (
    <p className="type-caption text-muted-foreground">
      Already set up?{" "}
      <Link to={ADMIN_LOGIN_PATH} className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </p>
  );

  return (
    <AdminAuthLayout
      shopName={shopName}
      eyebrow="First-time setup"
      title="Set up your shop"
      description="Create your owner account, verify email, and set a sign-in PIN."
      footer={footer}
      wide
    >
      <AdminOnboardingStepper steps={[...SETUP_STEPS]} current={step} />

      {step === "account" ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="setup-email">Owner email</Label>
            <Input
              id="setup-email"
              type="email"
              {...accountForm.register("email")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            {accountForm.formState.errors.email ? (
              <p className="mt-1 type-caption text-destructive">
                {accountForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="setup-password">Password</Label>
            <PasswordInput
              id="setup-password"
              autoComplete="new-password"
              {...accountForm.register("password")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            <p className="mt-1 type-caption text-muted-foreground">
              Recovery credential — daily sign-in uses your PIN.
            </p>
            {accountForm.formState.errors.password ? (
              <p className="mt-1 type-caption text-destructive">
                {accountForm.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="setup-confirm">Confirm password</Label>
            <PasswordInput
              id="setup-confirm"
              autoComplete="new-password"
              {...accountForm.register("confirmPassword")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            {accountForm.formState.errors.confirmPassword ? (
              <p className="mt-1 type-caption text-destructive">
                {accountForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          {tokenRequired ? (
            <div>
              <Label htmlFor="setup-token">Setup token</Label>
              <Input
                id="setup-token"
                {...accountForm.register("bootstrapToken")}
                className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
              />
              <p className="mt-1 type-caption text-muted-foreground">
                From BOOTSTRAP_TOKEN in server environment.
              </p>
            </div>
          ) : null}
          <AdminAuthDivider />
          <AdminGoogleAuthButton
            disabled={busy}
            busy={googleBusy}
            onClick={onGoogleSetup}
          />
        </div>
      ) : null}

      {step === "verify-email" && ownerEmail ? (
        <AdminEmailVerifyStep
          email={ownerEmail}
          purpose="signup"
          disabled={busy}
          onVerified={(token) => {
            setEmailVerificationToken(token);
            setStep("store");
          }}
        />
      ) : null}

      {step === "store" ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              {...storeForm.register("shop_name")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            {storeForm.formState.errors.shop_name ? (
              <p className="mt-1 type-caption text-destructive">
                {storeForm.formState.errors.shop_name.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="shop-phone">Phone</Label>
            <Input
              id="shop-phone"
              {...storeForm.register("phone")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
          </div>
          <div>
            <Label htmlFor="shop-whatsapp">WhatsApp</Label>
            <Input
              id="shop-whatsapp"
              {...storeForm.register("whatsapp")}
              className={cn("mt-1.5", ADMIN_AUTH_FIELD_CLASS)}
            />
            {storeForm.formState.errors.phone ? (
              <p className="mt-1 type-caption text-destructive">
                {storeForm.formState.errors.phone.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "payments" ? (
        <div className="space-y-3">
          <p className="type-body-sm text-muted-foreground">
            Choose how customers can pay. You can add merchant codes later in Settings.
          </p>
          {PAYMENT_PROVIDERS.map((provider) => (
            <div
              key={provider}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <div>
                <p className="type-body-sm font-medium">{PAYMENT_PROVIDER_LABELS[provider]}</p>
              </div>
              <Switch
                checked={enabledProviders.has(provider)}
                onCheckedChange={(on) => toggleProvider(provider, on)}
              />
            </div>
          ))}
        </div>
      ) : null}

      {step === "pin" ? (
        <div className="space-y-4">
          <p className="type-body-sm text-muted-foreground">
            Choose a 5-digit PIN for daily sign-in on the login screen.
          </p>
          <div>
            <Label>Choose PIN</Label>
            <div className="mt-2 flex justify-center">
              <AdminPinInput value={pin} onChange={setPin} disabled={busy} />
            </div>
          </div>
          <div>
            <Label>Confirm PIN</Label>
            <div className="mt-2 flex justify-center">
              <AdminPinInput value={confirmPin} onChange={setConfirmPin} disabled={busy} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-stack-lg flex flex-col gap-2 sm:flex-row sm:justify-between">
        {!isFirst && step !== "verify-email" ? (
          <Button type="button" variant="outline" onClick={goBack} disabled={busy} className={adminPrimaryTouch}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {isLast ? (
          <Button
            type="button"
            onClick={() => void finishSetup()}
            disabled={busy}
            className={`${adminPrimaryTouch} sm:ml-auto`}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Creating shop
              </>
            ) : (
              "Complete setup"
            )}
          </Button>
        ) : step === "verify-email" ? (
          <span className="sm:ml-auto" />
        ) : (
          <Button type="button" onClick={() => void goNext()} className={`${adminPrimaryTouch} sm:ml-auto`}>
            Continue
          </Button>
        )}
      </div>
    </AdminAuthLayout>
  );
}

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminWizardShell } from "@/components/admin/admin-wizard-shell";
import { AdminWizardStepGuide } from "@/components/admin/admin-wizard-step-guide";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdminInvite } from "@/lib/api/invites.functions";
import { listInvitableRoles } from "@/lib/api/roles.functions";
import { humanizeError } from "@/lib/errors";
import { TEAM_INVITE_STEPS, type TeamInviteStepId } from "@/lib/team-invite-steps";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role_id: z.string().uuid("Select a role"),
});

type FormData = z.infer<typeof schema>;

type InvitableRole = {
  id: string;
  name: string;
  description: string | null;
};

type TeamInviteWizardProps = {
  invitableRoles?: InvitableRole[];
  defaultRoleId?: string;
  onInviteCreated?: () => void;
  variant?: "page" | "modal";
  onComplete?: () => void;
  onCancel?: () => void;
};

export function TeamInviteWizard({
  invitableRoles: invitableRolesProp,
  defaultRoleId: defaultRoleIdProp,
  onInviteCreated,
  variant = "page",
  onComplete,
  onCancel,
}: TeamInviteWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<TeamInviteStepId>("email");
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const { data: fetchedRoles = [] } = useQuery({
    queryKey: ["invitable-roles"],
    queryFn: () => listInvitableRoles(),
    enabled: invitableRolesProp == null,
  });

  const invitableRoles = invitableRolesProp ?? fetchedRoles;
  const defaultRoleId = defaultRoleIdProp ?? invitableRoles[0]?.id ?? "";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role_id: defaultRoleId },
  });

  useEffect(() => {
    if (defaultRoleId && !form.getValues("role_id")) {
      form.setValue("role_id", defaultRoleId);
    }
  }, [defaultRoleId, form]);

  const values = form.watch();
  const selectedRole = invitableRoles.find((r) => r.id === values.role_id);

  const resetWizard = () => {
    setStep("email");
    setInviteUrl(null);
    setSentEmail(null);
    form.reset({ email: "", role_id: defaultRoleId });
  };

  const goNext = async () => {
    if (step === "email") {
      const valid = await form.trigger("email");
      if (!valid) return;
      setStep("role");
      return;
    }
    if (step === "role") {
      const valid = await form.trigger("role_id");
      if (!valid) return;
      setStep("send");
    }
  };

  const goBack = () => {
    if (step === "role") setStep("email");
    else if (step === "send") setStep("role");
  };

  const handleEmailBlur = async () => {
    const valid = await form.trigger("email");
    if (valid && step === "email") setStep("role");
  };

  const handleRoleSelect = (roleId: string) => {
    form.setValue("role_id", roleId, { shouldValidate: true });
    if (step === "role") {
      window.setTimeout(() => setStep("send"), 150);
    }
  };

  const sendInvite = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setBusy(true);
    try {
      const result = await createAdminInvite({ data: form.getValues() });
      setInviteUrl(result.inviteUrl);
      setSentEmail(result.email);
      toast.success(`Invite created for ${result.email}`);
      void qc.invalidateQueries({ queryKey: ["admin-invites"] });
      onInviteCreated?.();
    } catch (e: unknown) {
      toast.error(
        humanizeError(e, { fallback: "Could not create invite.", action: "invite staff" }),
      );
    } finally {
      setBusy(false);
    }
  };

  if (invitableRoles.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-4 type-body-sm text-muted-foreground">
        No invitable roles are configured. Create a custom role first.
      </p>
    );
  }

  const shell = (
    <AdminWizardShell
      variant={variant}
      steps={[...TEAM_INVITE_STEPS]}
      currentStep={step}
      title="Invite teammate"
      subtitle="One link — install the app and join in the same flow."
      isFirstStep={step === "email"}
      isLastStep={step === "send"}
      onBack={step !== "email" && !inviteUrl ? goBack : undefined}
      onNext={step !== "send" ? goNext : undefined}
      onFinish={inviteUrl ? onComplete : sendInvite}
      onCancel={onCancel}
      finishLabel={inviteUrl ? "Done" : "Create invite link"}
      nextDisabled={
        step === "email" ? !values.email.trim() : step === "role" ? !values.role_id : false
      }
      finishDisabled={busy}
      busy={busy}
    >
      {step === "email" ? (
        <div className="max-w-md space-y-3">
          <AdminWizardStepGuide>
            Enter their work email — we&apos;ll generate a secure invite link.
          </AdminWizardStepGuide>
          <div>
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="mt-1.5"
              {...form.register("email")}
              onBlur={() => void handleEmailBlur()}
            />
            {form.formState.errors.email ? (
              <p className="mt-1 type-caption text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "role" ? (
        <div className="space-y-3">
          <AdminWizardStepGuide>
            Choose what {values.email || "they"} can access in the admin app.
          </AdminWizardStepGuide>
          <ul className="grid gap-2 sm:grid-cols-2">
            {invitableRoles.map((role) => {
              const active = values.role_id === role.id;
              return (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/30 hover:bg-secondary/40"
                    }`}
                  >
                    <p className="font-medium">{role.name}</p>
                    {role.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {form.formState.errors.role_id ? (
            <p className="type-caption text-destructive">{form.formState.errors.role_id.message}</p>
          ) : null}
        </div>
      ) : null}

      {step === "send" ? (
        <div className="space-y-3">
          {!inviteUrl ? (
            <AdminWizardStepGuide>
              Review the details, then share one link — they install Kate Admin and complete signup
              from the same page.
            </AdminWizardStepGuide>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Email</span>{" "}
              <span className="font-medium">{values.email}</span>
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Role</span>{" "}
              <span className="font-medium">{selectedRole?.name ?? "—"}</span>
            </p>
          </div>

          {inviteUrl ? (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium">Invite link for {sentEmail}</p>
              <p className="text-xs text-muted-foreground">
                Send via WhatsApp or email. On Android, this link installs the app and walks them
                through signup — no separate download step.
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={inviteUrl} label="Copy link" />
                <Button type="button" variant="outline" size="sm" onClick={resetWizard}>
                  Invite someone else
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminWizardShell>
  );

  return variant === "page" ? <div className="rounded-lg border bg-card p-6">{shell}</div> : shell;
}

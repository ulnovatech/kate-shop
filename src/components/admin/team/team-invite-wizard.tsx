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
import { createAdminInvite } from "@/lib/api/invites.functions";
import { listInvitableRoles } from "@/lib/api/roles.functions";
import { humanizeError } from "@/lib/errors";
import { TEAM_INVITE_STEPS, type TeamInviteStepId } from "@/lib/team-invite-steps";

const schema = z.object({
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
  const [step, setStep] = useState<TeamInviteStepId>("role");
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  const { data: fetchedRoles = [] } = useQuery({
    queryKey: ["invitable-roles"],
    queryFn: () => listInvitableRoles(),
    enabled: invitableRolesProp == null,
  });

  const invitableRoles = invitableRolesProp ?? fetchedRoles;
  const defaultRoleId = defaultRoleIdProp ?? invitableRoles[0]?.id ?? "";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role_id: defaultRoleId },
  });

  useEffect(() => {
    if (defaultRoleId && !form.getValues("role_id")) {
      form.setValue("role_id", defaultRoleId);
    }
  }, [defaultRoleId, form]);

  const values = form.watch();
  const selectedRole = invitableRoles.find((r) => r.id === values.role_id);

  const resetWizard = () => {
    setStep("role");
    setInviteUrl(null);
    setRoleName(null);
    form.reset({ role_id: defaultRoleId });
  };

  const goNext = async () => {
    if (step === "role") {
      const valid = await form.trigger("role_id");
      if (!valid) return;
      setStep("link");
    }
  };

  const goBack = () => {
    if (step === "link" && !inviteUrl) setStep("role");
  };

  const handleRoleSelect = (roleId: string) => {
    form.setValue("role_id", roleId, { shouldValidate: true });
    if (step === "role") {
      window.setTimeout(() => setStep("link"), 150);
    }
  };

  const createInviteLink = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setBusy(true);
    try {
      const result = await createAdminInvite({ data: form.getValues() });
      setInviteUrl(result.inviteUrl);
      setRoleName(result.roleName);
      toast.success("Invite link created — share it once with your teammate.");
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
      subtitle="Single-use link — works for one person, then expires."
      isFirstStep={step === "role"}
      isLastStep={step === "link"}
      onBack={step !== "role" && !inviteUrl ? goBack : undefined}
      onNext={step === "role" ? goNext : undefined}
      onFinish={inviteUrl ? onComplete : createInviteLink}
      onCancel={onCancel}
      finishLabel={inviteUrl ? "Done" : "Create invite link"}
      nextDisabled={step === "role" ? !values.role_id : false}
      finishDisabled={busy}
      busy={busy}
    >
      {step === "role" ? (
        <div className="space-y-3">
          <AdminWizardStepGuide>
            Choose what this teammate can access. They will pick their own work email when they open
            the link.
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

      {step === "link" ? (
        <div className="space-y-3">
          {!inviteUrl ? (
            <AdminWizardStepGuide>
              We will generate a one-time link for{" "}
              <span className="font-medium text-foreground">
                {selectedRole?.name ?? "this role"}
              </span>
              . Share it privately — it expires in 7 days and works once.
            </AdminWizardStepGuide>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Role</span>{" "}
              <span className="font-medium">{roleName ?? selectedRole?.name ?? "—"}</span>
            </p>
            <p className="mt-2 text-muted-foreground">
              Staff choose their own email during signup. No need to collect it here.
            </p>
          </div>

          {inviteUrl ? (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium">One-time invite link</p>
              <p className="text-xs text-muted-foreground">
                Single-use link — works for one person, then expires. Send via WhatsApp or any
                channel. On Android, opens the app if installed; otherwise prompts install once.
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={inviteUrl} label="Copy link" />
                <Button type="button" variant="outline" size="sm" onClick={resetWizard}>
                  Create another link
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

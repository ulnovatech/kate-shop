import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminCoverPhotoPicker,
  type CoverPhotoValue,
} from "@/components/admin/admin-cover-photo-picker";
import { AdminWizardShell } from "@/components/admin/admin-wizard-shell";
import { AdminWizardStepGuide } from "@/components/admin/admin-wizard-step-guide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordAudit } from "@/lib/api/audit.functions";
import { pickCategoryAuditFields } from "@/lib/audit";
import { ensureUniqueCategorySlug } from "@/lib/catalog";
import { getChildCategories, type CategoryRecord } from "@/lib/categories";
import {
  CATEGORY_WIZARD_STEPS,
  type CategoryWizardStepId,
} from "@/lib/category-wizard-steps";
import { humanizeError } from "@/lib/errors";
import { processAndUploadProductImage } from "@/lib/media";
import { resolveProductImageUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});

type FormData = z.infer<typeof schema>;

type CategoryWizardProps = {
  variant?: "page" | "modal";
  onComplete?: () => void;
  onCancel?: () => void;
};

export function CategoryWizard({
  variant = "modal",
  onComplete,
  onCancel,
}: CategoryWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<CategoryWizardStepId>("name");
  const [cover, setCover] = useState<CoverPhotoValue | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const values = form.watch();

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const parentId = null;
      const slug = await ensureUniqueCategorySlug(data.name);
      const categories =
        (await supabase.from("categories").select("*").is("deleted_at", null)).data ?? [];
      const siblingCount = getChildCategories(parentId, categories as CategoryRecord[]).length;
      const { data: row, error } = await supabase
        .from("categories")
        .insert({
          name: data.name,
          slug,
          parent_id: parentId,
          sort_order: siblingCount,
          cover_image_url: cover?.image_url ?? null,
          cover_thumbnail_url: cover?.thumbnail_url ?? null,
          cover_medium_url: cover?.medium_url ?? cover?.image_url ?? null,
          cover_full_url: cover?.full_url ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      void recordAudit({
        data: {
          action: "category_created",
          entity_type: "category",
          entity_id: row.id,
          after: pickCategoryAuditFields(row as Record<string, unknown>),
        },
      });
      return row;
    },
    onSuccess: (row) => {
      setCreatedName(row.name);
      void qc.invalidateQueries({ queryKey: ["admin-categories"] });
      void qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`Category "${row.name}" created`);
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not create category." })),
  });

  const goNext = useCallback(async () => {
    if (step === "name") {
      const valid = await form.trigger("name");
      if (!valid) return;
      setStep("cover");
      return;
    }
    if (step === "cover") {
      setStep("review");
    }
  }, [form, step]);

  const goBack = useCallback(() => {
    if (step === "cover") setStep("name");
    else if (step === "review") setStep("cover");
  }, [step]);

  const handleCreate = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    await createMutation.mutateAsync(form.getValues());
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      return await processAndUploadProductImage(file);
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not upload cover photo." }));
      throw e;
    } finally {
      setUploadingCover(false);
    }
  };

  const busy = createMutation.isPending || uploadingCover;
  const isDone = createdName != null;
  const coverPreview = cover
    ? resolveProductImageUrl(
        {
          image_url: cover.image_url,
          thumbnail_url: cover.thumbnail_url ?? null,
          medium_url: cover.medium_url ?? null,
          full_url: cover.full_url ?? null,
        },
        "thumb",
      )
    : "";

  return (
    <AdminWizardShell
      variant={variant}
      steps={[...CATEGORY_WIZARD_STEPS]}
      currentStep={step}
      title="Add category"
      subtitle="Name, cover photo, then review."
      isFirstStep={step === "name"}
      isLastStep={step === "review"}
      onBack={step !== "name" && !isDone ? goBack : undefined}
      onNext={step !== "review" && !isDone ? goNext : undefined}
      onFinish={isDone ? onComplete : handleCreate}
      onCancel={onCancel}
      finishLabel={isDone ? "Done" : "Create category"}
      nextLabel={step === "cover" ? "Continue" : "Next"}
      nextDisabled={step === "name" ? values.name.trim().length < 2 : false}
      finishDisabled={busy || isDone}
      busy={busy}
    >
      {step === "name" ? (
        <div className="space-y-3">
          <AdminWizardStepGuide>
            Enter a short name shoppers will recognize — e.g. &quot;Rings&quot; or &quot;New
            arrivals&quot;.
          </AdminWizardStepGuide>
          <div>
            <Label htmlFor="category-wizard-name">Category name</Label>
            <Input
              id="category-wizard-name"
              placeholder="e.g. Necklaces"
              autoFocus
              className="mt-1.5"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="mt-1 type-caption text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "cover" ? (
        <div className="space-y-3">
          <AdminWizardStepGuide>
            Add a cover for &quot;{values.name}&quot; — optional, but helps shoppers browse your
            shop.
          </AdminWizardStepGuide>
          <AdminCoverPhotoPicker
            value={cover}
            uploading={uploadingCover}
            onChange={setCover}
            onUpload={handleCoverUpload}
          />
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-4">
          {isDone ? (
            <>
              <AdminWizardStepGuide>
                <strong>{createdName}</strong> is ready. Close this wizard or add another category
                from the menu.
              </AdminWizardStepGuide>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreatedName(null);
                  setCover(null);
                  form.reset({ name: "" });
                  setStep("name");
                }}
              >
                Add another category
              </Button>
            </>
          ) : (
            <>
              <AdminWizardStepGuide>Review the details below, then create your category.</AdminWizardStepGuide>
              <dl className={cn("space-y-3 rounded-lg border bg-muted/30 p-3 type-body-sm")}>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-right">{values.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Cover</dt>
                  <dd className="text-right">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt=""
                        className="ml-auto h-14 w-14 rounded-md border object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </dd>
                </div>
              </dl>
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => void handleCreate()}
              >
                Create category
              </Button>
            </>
          )}
        </div>
      ) : null}
    </AdminWizardShell>
  );
}

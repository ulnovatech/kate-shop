import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminWizardShell } from "@/components/admin/admin-wizard-shell";
import { AdminWizardStepGuide } from "@/components/admin/admin-wizard-step-guide";
import { AdminProductListSkeleton } from "@/components/loading-states";
import { adminUrl } from "@/lib/admin-routes";
import {
  EssentialsCategoryField,
  EssentialsStepPanel,
  PhotosStepPanel,
  ReviewStepPanel,
  StockPricingStepPanel,
  VisibilitySeoStepPanel,
} from "./product-wizard-step-panels";
import {
  PRODUCT_WIZARD_STEPS,
  type ProductWizardStepId,
} from "./product-wizard-schema";
import { useProductWizard } from "./use-product-wizard";

const STEP_GUIDES: Record<ProductWizardStepId, string> = {
  photos: "Add at least one photo. The first image is the cover shoppers see.",
  essentials: "Enter the product name and details shown on your shop.",
  stock: "Set the price in UGX and how many units you have available.",
  visibility: "Choose shop visibility and optional search preview text.",
  review: "Check everything, then publish or save as a draft.",
};

type ProductWizardProps = {
  productId?: string;
  initialStep?: ProductWizardStepId;
  title?: string;
  subtitle?: string;
  variant?: "page" | "modal";
  onComplete?: () => void;
  onCancel?: () => void;
};

export function ProductWizard({
  productId,
  initialStep = "photos",
  title,
  subtitle,
  variant = "page",
  onComplete,
  onCancel,
}: ProductWizardProps) {
  const isModal = variant === "modal";
  const wizard = useProductWizard({
    productId,
    initialStep,
    modalMode: isModal,
    onComplete,
  });

  if (wizard.loadingProduct && productId) {
    return <AdminProductListSkeleton />;
  }

  const resolvedTitle =
    title ?? (productId ? "Edit product" : isModal ? "Add product" : "New product");
  const resolvedSubtitle =
    subtitle ??
    (productId
      ? "Update photos, details, and visibility."
      : "Step-by-step — photos, details, then publish.");

  const stepContent = (() => {
    if (wizard.draftPromptOpen) {
      return null;
    }

    const guide = (
      <AdminWizardStepGuide className="mb-3">
        {STEP_GUIDES[wizard.currentStep]}
      </AdminWizardStepGuide>
    );

    switch (wizard.currentStep) {
      case "photos":
        return (
          <>
            {guide}
            <PhotosStepPanel
              form={wizard.form}
              images={wizard.images}
              productName={wizard.productName}
              uploading={wizard.uploading}
              isMobile={wizard.isMobile}
              galleryInputRef={wizard.galleryInputRef}
              cameraInputRef={wizard.cameraInputRef}
              onFileInputChange={wizard.onFileInputChange}
              onUpdateAlt={wizard.updateAlt}
              onRemoveImage={(idx) => void wizard.removeImage(idx)}
              onMoveImage={wizard.moveImage}
              onReorderImages={wizard.setImages}
              onOpenGallery={wizard.openGallery}
              onOpenCamera={wizard.openCamera}
            />
          </>
        );
      case "essentials":
        return (
          <>
            {guide}
            <div className="space-y-stack">
              <EssentialsStepPanel form={wizard.form} />
              <EssentialsCategoryField
                form={wizard.form}
                categoryOptions={wizard.categoryOptions}
              />
            </div>
          </>
        );
      case "stock":
        return (
          <>
            {guide}
            <StockPricingStepPanel
              form={wizard.form}
              reservedStock={wizard.reservedStock}
            />
          </>
        );
      case "visibility":
        return (
          <>
            {guide}
            <VisibilitySeoStepPanel form={wizard.form} />
          </>
        );
      case "review":
        return (
          <>
            {guide}
            <ReviewStepPanel
              form={wizard.form}
              images={wizard.images}
              slug={wizard.slug}
              categoryLabel={wizard.categoryLabel}
            />
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <AdminWizardShell
        variant={variant}
        steps={PRODUCT_WIZARD_STEPS}
        currentStep={wizard.currentStep}
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
        isFirstStep={wizard.isFirstStep}
        isLastStep={wizard.isLastStep}
        busy={wizard.busy || wizard.uploading}
        nextDisabled={wizard.uploading || wizard.draftPromptOpen}
        finishDisabled={wizard.uploading || wizard.draftPromptOpen}
        onBack={wizard.draftPromptOpen ? undefined : wizard.handleBack}
        onNext={wizard.draftPromptOpen ? undefined : wizard.handleNext}
        onFinish={wizard.draftPromptOpen ? undefined : () => void wizard.finish(true)}
        onCancel={isModal ? onCancel : undefined}
        nextLabel="Save & continue"
        finishLabel="Publish to shop"
        footerExtra={
          !isModal && wizard.isLastStep ? (
            <Button
              type="button"
              variant="outline"
              disabled={wizard.busy}
              onClick={() => void wizard.finish(false)}
            >
              Save as draft
            </Button>
          ) : !isModal ? (
            <Button type="button" variant="ghost" asChild>
              <Link to={adminUrl("/products")}>Exit to products</Link>
            </Button>
          ) : wizard.isLastStep ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={wizard.busy}
              onClick={() => void wizard.finish(false)}
            >
              Save as draft
            </Button>
          ) : null
        }
      >
        {wizard.draftPromptOpen && isModal ? (
          <div
            className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4"
            role="region"
            aria-labelledby="product-draft-prompt-title"
          >
            <div className="space-y-1">
              <h3 id="product-draft-prompt-title" className="type-body-sm font-medium">
                Resume your draft?
              </h3>
              <p className="type-caption text-muted-foreground">
                You have an unsaved new product draft. Continue where you left off or start fresh.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => wizard.recoverDraft()}>
                Resume draft
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={wizard.discardDraft}>
                Start fresh
              </Button>
            </div>
          </div>
        ) : (
          stepContent
        )}
      </AdminWizardShell>

      {!isModal ? (
        <AdminConfirmDialog
          open={wizard.draftPromptOpen}
          onOpenChange={(open) => {
            if (!open && wizard.pendingDraft) {
              wizard.discardDraft();
            } else {
              wizard.setDraftPromptOpen(open);
            }
          }}
          title="Resume your draft?"
          description="You have an unsaved new product draft. Would you like to continue where you left off?"
          confirmLabel="Resume draft"
          cancelLabel="Start fresh"
          onConfirm={() => {
            wizard.recoverDraft();
            wizard.setDraftPromptOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

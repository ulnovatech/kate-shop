import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_IMAGE_SELECT } from "@/lib/shop";
import {
  buildCategoryTree,
  flattenCategoryTreeForSelect,
  type CategoryRecord,
} from "@/lib/categories";
import { deleteProductImageFiles, processAndUploadProductImage } from "@/lib/media";
import { resetFileInput, openCameraCapture, openGalleryPicker } from "@/lib/mobile-upload";
import { humanizeError } from "@/lib/errors";
import { ADMIN_SETUP_COMPLETION_QUERY_KEY } from "@/lib/admin-setup-completion";
import { adminUrl } from "@/lib/admin-routes";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  clearNewProductWizardDraft,
  loadNewProductWizardDraft,
  loadWizardStepForProduct,
  saveNewProductWizardDraft,
  saveWizardStepForProduct,
} from "./product-wizard-draft";
import { persistProductWizard } from "./product-wizard-persist";
import {
  PRODUCT_WIZARD_DEFAULTS,
  PRODUCT_WIZARD_STEP_IDS,
  type ProductWizardFormData,
  type ProductWizardStepId,
  WIZARD_STEP_FIELDS,
  productWizardSchema,
} from "./product-wizard-schema";
import type { ExistingProductRecord, ProductWizardImage } from "./types";

function stepIndex(step: ProductWizardStepId): number {
  return PRODUCT_WIZARD_STEP_IDS.indexOf(step);
}

function stepFromIndex(index: number): ProductWizardStepId {
  return PRODUCT_WIZARD_STEP_IDS[Math.max(0, Math.min(index, PRODUCT_WIZARD_STEP_IDS.length - 1))];
}

export function useProductWizard({
  productId: initialProductId,
  initialStep,
  onProductCreated,
  modalMode = false,
  onComplete,
}: {
  productId?: string;
  initialStep: ProductWizardStepId;
  onProductCreated?: (id: string) => void;
  modalMode?: boolean;
  onComplete?: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [productId, setProductId] = useState(initialProductId);
  const [currentStep, setCurrentStep] = useState<ProductWizardStepId>(initialStep);
  const [images, setImages] = useState<ProductWizardImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState("");
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [pendingDraft, setPendingDraft] =
    useState<ReturnType<typeof loadNewProductWizardDraft>>(null);
  const hydratedRef = useRef(false);

  const form = useForm<ProductWizardFormData>({
    resolver: zodResolver(productWizardSchema),
    defaultValues: PRODUCT_WIZARD_DEFAULTS,
    mode: "onChange",
  });

  const productName = form.watch("name");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      (await supabase.from("categories").select("*").is("deleted_at", null).order("sort_order"))
        .data ?? [],
  });

  const categoryOptions = useMemo(
    () => flattenCategoryTreeForSelect(buildCategoryTree(categories as CategoryRecord[])),
    [categories],
  );

  const { data: existing, isLoading: loadingProduct } = useQuery({
    queryKey: ["product-edit", productId],
    enabled: !!productId,
    queryFn: async () =>
      (
        await supabase
          .from("products")
          .select(`*, product_images(${PRODUCT_IMAGE_SELECT})`)
          .eq("id", productId!)
          .maybeSingle()
      ).data as ExistingProductRecord | null,
  });

  useEffect(() => {
    if (!productId || hydratedRef.current) return;
    if (!existing) return;

    form.reset({
      name: existing.name,
      description: existing.description ?? "",
      material: existing.material ?? "",
      category_id: existing.category_id ?? null,
      price: Number(existing.price),
      sku: existing.sku ?? "",
      stock_quantity: existing.stock_quantity,
      low_stock_threshold: existing.low_stock_threshold ?? 5,
      is_visible: existing.is_visible,
      is_featured: existing.is_featured,
      meta_title: existing.meta_title ?? "",
      meta_description: existing.meta_description ?? "",
    });
    setSlug(existing.slug);
    setImages(
      (existing.product_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => ({
          id: i.id,
          image_url: i.image_url,
          thumbnail_url: i.thumbnail_url ?? undefined,
          medium_url: i.medium_url ?? undefined,
          full_url: i.full_url ?? undefined,
          sort_order: i.sort_order,
          alt_text: i.alt_text ?? "",
        })),
    );

    if (initialStep !== "photos") {
      setCurrentStep(initialStep);
    } else {
      const savedStep = loadWizardStepForProduct(productId);
      if (savedStep && PRODUCT_WIZARD_STEP_IDS.includes(savedStep as ProductWizardStepId)) {
        setCurrentStep(savedStep as ProductWizardStepId);
      }
    }

    hydratedRef.current = true;
  }, [existing, form, initialStep, productId]);

  useEffect(() => {
    if (productId || hydratedRef.current) return;
    const draft = loadNewProductWizardDraft();
    if (draft) {
      setPendingDraft(draft);
      setDraftPromptOpen(true);
    }
    hydratedRef.current = true;
  }, [productId]);

  const syncDraft = useCallback(() => {
    if (productId) return;
    saveNewProductWizardDraft({
      savedAt: new Date().toISOString(),
      step: currentStep,
      form: form.getValues(),
      images,
    });
  }, [currentStep, form, images, productId]);

  useEffect(() => {
    if (productId || draftPromptOpen) return;
    const subscription = form.watch(() => {
      syncDraft();
    });
    return () => subscription.unsubscribe();
  }, [draftPromptOpen, form, productId, syncDraft]);

  const invalidateCatalog = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: ["shop-products"] });
    void qc.invalidateQueries({ queryKey: ["featured"] });
    void qc.invalidateQueries({ queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY });
    if (productId) void qc.invalidateQueries({ queryKey: ["product-edit", productId] });
  }, [productId, qc]);

  const validateCurrentStep = useCallback(async () => {
    const fields = WIZARD_STEP_FIELDS[currentStep];
    if (fields.length === 0) return true;
    return form.trigger(fields);
  }, [currentStep, form]);

  const persist = useCallback(
    async (values: ProductWizardFormData) => {
      const result = await persistProductWizard({
        productId,
        values,
        images,
        existing: existing ?? null,
      });

      if (!productId) {
        setProductId(result.id);
        setSlug(result.slug);
        clearNewProductWizardDraft();
        onProductCreated?.(result.id);
        setImages((prev) => prev.map((img) => ({ ...img, isNew: false })));
      } else if (!slug) {
        setSlug(result.slug);
      }

      invalidateCatalog();
      return result;
    },
    [existing, images, invalidateCatalog, onProductCreated, productId, slug],
  );

  const goToStep = useCallback(
    (step: ProductWizardStepId, options?: { productId?: string }) => {
      const resolvedProductId = options?.productId ?? productId;
      setCurrentStep(step);
      if (resolvedProductId) {
        saveWizardStepForProduct(resolvedProductId, step);
      }
      if (!modalMode) {
        if (resolvedProductId) {
          void navigate({
            to: adminUrl("/products/$id"),
            params: { id: resolvedProductId },
            search: { step },
            replace: true,
          });
        } else {
          void navigate({
            to: adminUrl("/products/new"),
            search: { step },
            replace: true,
          });
        }
      }
    },
    [modalMode, navigate, productId],
  );

  const handleNext = useCallback(async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;

    const next = stepFromIndex(stepIndex(currentStep) + 1);
    setBusy(true);
    try {
      if (!productId && currentStep === "photos") {
        syncDraft();
        goToStep(next);
        return;
      }

      const values = form.getValues();
      const result = await persist(values);

      if (!productId) {
        setProductId(result.id);
      } else {
        saveWizardStepForProduct(result.id, currentStep);
      }

      toast.success("Saved", { duration: 1500 });
      goToStep(next, { productId: result.id });
    } catch (e) {
      toast.error(humanizeError(e, { fallback: "Could not save. Check the form and try again." }));
    } finally {
      setBusy(false);
    }
  }, [
    currentStep,
    form,
    goToStep,
    modalMode,
    navigate,
    persist,
    productId,
    syncDraft,
    validateCurrentStep,
  ]);

  const handleBack = useCallback(() => {
    goToStep(stepFromIndex(stepIndex(currentStep) - 1));
  }, [currentStep, goToStep]);

  const finish = useCallback(
    async (publish: boolean) => {
      const valid = await form.trigger();
      if (!valid) {
        toast.error("Fix the highlighted fields before publishing.");
        return;
      }

      setBusy(true);
      try {
        const values = {
          ...form.getValues(),
          is_visible: publish ? true : form.getValues().is_visible,
        };
        if (publish) form.setValue("is_visible", true);

        await persist(values);
        clearNewProductWizardDraft();
        if (productId) saveWizardStepForProduct(productId, "review");

        toast.success(publish ? "Product published" : "Draft saved");
        if (modalMode) {
          onComplete?.();
        } else {
          navigate({ to: adminUrl("/products") });
        }
      } catch (e) {
        toast.error(humanizeError(e, { fallback: "Could not save this product." }));
      } finally {
        setBusy(false);
      }
    },
    [form, modalMode, navigate, onComplete, persist, productId],
  );

  const recoverDraft = useCallback(() => {
    if (!pendingDraft) return;
    form.reset(pendingDraft.form);
    setImages(pendingDraft.images);
    if (PRODUCT_WIZARD_STEP_IDS.includes(pendingDraft.step as ProductWizardStepId)) {
      setCurrentStep(pendingDraft.step as ProductWizardStepId);
    }
    setDraftPromptOpen(false);
    setPendingDraft(null);
  }, [form, pendingDraft]);

  const discardDraft = useCallback(() => {
    clearNewProductWizardDraft();
    setDraftPromptOpen(false);
    setPendingDraft(null);
  }, []);

  const handleUpload = async (files: FileList | null, input?: HTMLInputElement | null) => {
    if (!files?.length) return;
    setUploading(true);
    const next: ProductWizardImage[] = [];
    try {
      for (const file of Array.from(files)) {
        const uploaded = await processAndUploadProductImage(file);
        next.push({
          ...uploaded,
          sort_order: images.length + next.length,
          alt_text: productName.trim() || "",
          isNew: true,
        });
      }
      setImages([...images, ...next]);
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not upload the photo. Please try again." }));
    } finally {
      setUploading(false);
      resetFileInput(input ?? null);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleUpload(e.target.files, e.target);
  };

  const removeImage = async (idx: number) => {
    const img = images[idx];
    try {
      if (img.id) {
        await supabase.from("product_images").delete().eq("id", img.id);
      }
      await deleteProductImageFiles(img);
      setImages(images.filter((_, i) => i !== idx).map((x, i) => ({ ...x, sort_order: i })));
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not remove this photo." }));
    }
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[idx], next[j]] = [next[j], next[idx]];
    setImages(next.map((x, i) => ({ ...x, sort_order: i })));
  };

  const categoryLabel = useMemo(() => {
    const id = form.watch("category_id");
    if (!id) return "Uncategorized";
    const match = categoryOptions.find((c) => c.id === id);
    return match?.label ?? "Uncategorized";
  }, [categoryOptions, form]);

  const currentIndex = stepIndex(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === PRODUCT_WIZARD_STEP_IDS.length - 1;

  return {
    form,
    images,
    slug,
    busy,
    uploading,
    loadingProduct,
    isMobile,
    galleryInputRef,
    cameraInputRef,
    currentStep,
    isFirstStep,
    isLastStep,
    categoryOptions,
    categoryLabel,
    draftPromptOpen,
    setDraftPromptOpen,
    recoverDraft,
    discardDraft,
    handleNext,
    handleBack,
    finish,
    onFileInputChange,
    removeImage,
    moveImage,
    setImages,
    updateAlt: (idx: number, alt: string) => {
      setImages(images.map((img, i) => (i === idx ? { ...img, alt_text: alt } : img)));
    },
    openGallery: () => openGalleryPicker(galleryInputRef.current),
    openCamera: () => openCameraCapture(cameraInputRef.current),
    productName,
    reservedStock: existing?.reserved_stock ?? 0,
    pendingDraft,
  };
}

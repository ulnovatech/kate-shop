import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductWizard } from "./product-wizard";
import { saveNewProductWizardDraft } from "./product-wizard-draft";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        is: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("ProductWizard", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("renders the new product wizard shell on /products/new", () => {
    render(<ProductWizard />, { wrapper });

    expect(screen.getByRole("heading", { name: "New product" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product photos" })).toBeInTheDocument();
    expect(screen.getAllByText("Photos").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /save & continue/i })).toBeInTheDocument();
  });

  it("shows inline draft prompt in modal mode (no nested alert dialog)", () => {
    saveNewProductWizardDraft({
      savedAt: new Date().toISOString(),
      step: "photos",
      form: {
        name: "Draft ring",
        description: "",
        material: "",
        category_id: null,
        price: 0,
        sku: "",
        stock_quantity: 0,
        low_stock_threshold: 5,
        is_visible: false,
        is_featured: false,
        meta_title: "",
        meta_description: "",
      },
      images: [],
    });

    render(<ProductWizard variant="modal" />, { wrapper });

    expect(screen.getByRole("region", { name: /resume your draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start fresh/i })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

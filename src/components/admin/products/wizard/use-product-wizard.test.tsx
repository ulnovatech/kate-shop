import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProductWizard } from "./use-product-wizard";

vi.mock("@tanstack/react-router", () => ({
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

describe("useProductWizard", () => {
  it("mounts without ReferenceError (goToStep before handleNext)", () => {
    const { result } = renderHook(
      () => useProductWizard({ initialStep: "photos" }),
      { wrapper },
    );

    expect(result.current.currentStep).toBe("photos");
    expect(result.current.isFirstStep).toBe(true);
    expect(typeof result.current.handleNext).toBe("function");
    expect(typeof result.current.handleBack).toBe("function");
  });
});

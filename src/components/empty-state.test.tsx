import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Package } from "lucide-react";
import { EmptyState, StorefrontEmptyState } from "@/components/empty-state";
import { EmptyStateIllustration } from "@/components/empty-state-illustrations";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No products yet" description="Add your first product to start selling." />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No products yet" })).toBeInTheDocument();
    expect(screen.getByText("Add your first product to start selling.")).toBeInTheDocument();
  });

  it("renders primary action button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EmptyState title="Empty" primaryAction={{ label: "Add product", onClick }} />);
    await user.click(screen.getByRole("button", { name: "Add product" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders icon when provided", () => {
    render(<EmptyState icon={Package} title="No items" />);
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("renders illustration when provided", () => {
    const { container } = render(<EmptyState illustration="cart" title="Empty cart" />);
    expect(screen.getByRole("heading", { name: "Empty cart" })).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});

describe("EmptyStateIllustration", () => {
  it("renders cart artwork", () => {
    const { container } = render(<EmptyStateIllustration id="cart" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

describe("StorefrontEmptyState", () => {
  it("uses storefront variant styling", () => {
    const { container } = render(<StorefrontEmptyState title="Cart is empty" />);
    expect(container.firstChild).toHaveClass("bg-cream/50");
  });
});

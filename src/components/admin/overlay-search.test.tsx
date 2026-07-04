import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverlaySearch } from "./overlay-search";

describe("OverlaySearch", () => {
  it("shows magnifier until expanded", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OverlaySearch value="" onChange={onChange} searchLabel="Search products" />,
    );

    expect(screen.getByRole("button", { name: "Search products" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Search products" }));
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<OverlaySearch value="" onChange={onChange} searchLabel="Search" />);
    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.type(screen.getByRole("searchbox"), "dress");

    expect(onChange).toHaveBeenCalled();
  });

  it("shows clear control when value is set", () => {
    render(<OverlaySearch value="kate" onChange={vi.fn()} searchLabel="Search" inputId="product-search" />);
    expect(screen.getByDisplayValue("kate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });
});

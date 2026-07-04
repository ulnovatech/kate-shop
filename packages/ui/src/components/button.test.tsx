import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders accessible label", () => {
    render(<Button>Sign in</Button>);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<Button disabled>Please wait...</Button>);
    expect(screen.getByRole("button", { name: "Please wait..." })).toBeDisabled();
  });
});

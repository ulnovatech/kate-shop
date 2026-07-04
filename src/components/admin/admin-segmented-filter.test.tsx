import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSegmentedFilter } from "./admin-segmented-filter";

describe("AdminSegmentedFilter", () => {
  it("renders options and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AdminSegmentedFilter
        value="active"
        onChange={onChange}
        ariaLabel="Product status"
        options={[
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" },
        ]}
      />,
    );

    expect(screen.getByRole("group", { name: "Product status" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Archived" }));
    expect(onChange).toHaveBeenCalledWith("archived");
  });
});

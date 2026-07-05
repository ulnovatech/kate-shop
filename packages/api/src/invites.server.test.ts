import { describe, expect, it, vi, beforeEach } from "vitest";
import { consumeAdminInvite } from "./invites.server";

const maybeSingle = vi.fn();
const update = vi.fn(() => ({
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  select: vi.fn(() => ({ maybeSingle })),
}));

vi.mock("@kate/supabase/client.server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({ update })),
  },
}));

describe("consumeAdminInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when invite was already used", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(consumeAdminInvite("invite-id", "staff@example.com")).rejects.toThrow(
      "already been used",
    );
  });

  it("succeeds when row is updated", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "invite-id" }, error: null });
    await expect(consumeAdminInvite("invite-id", "staff@example.com")).resolves.toBeUndefined();
  });
});

import { createMiddleware } from "@tanstack/react-start";
import { KATE_OPEN_ROLE_HEADER } from "@kate/domain/staff-auth-mode";
import { getOpenStaffRole, isStaffAuthRequired } from "@/lib/staff-open-mode";

/** Attach open-mode role header on serverFn RPCs when staff auth is hibernated. */
export const attachStaffOpenRole = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (isStaffAuthRequired()) {
      return next({ headers: {} });
    }
    return next({
      headers: {
        [KATE_OPEN_ROLE_HEADER]: getOpenStaffRole(),
      },
    });
  },
);

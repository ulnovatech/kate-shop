import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { StaffRole } from "@/lib/db/contracts";
import { permissionsFromStaffAccess, permissionsForRole, type AdminPermissions } from "@/lib/rbac";
import { fetchStaffAccess } from "@/lib/api/roles.functions";
import { withTimeout } from "@/lib/with-timeout";

const AUTH_TIMEOUT_MS = 8_000;

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isOwner: boolean;
  staffRole: StaffRole | null;
  permissions: AdminPermissions;
  /** True only until the first session + permissions resolve (cold start). */
  initialLoading: boolean;
  /** True during background permission refresh (e.g. token refresh). */
  refreshing: boolean;
  /** @deprecated Use `initialLoading` — kept for existing callers. */
  loading: boolean;
  signOut: () => Promise<void>;
};

const emptyPerms = permissionsForRole(null);

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  isAdmin: false,
  isOwner: false,
  staffRole: null,
  permissions: emptyPerms,
  initialLoading: true,
  refreshing: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>(emptyPerms);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const accessResolved = useRef(false);

  const isAdmin = permissions.canAccessAdmin;
  const isOwner = permissions.canManageSettings;
  const staffRole = permissions.role;

  const applyAccess = (access: Awaited<ReturnType<typeof fetchStaffAccess>>) => {
    if (access) {
      setPermissions(permissionsFromStaffAccess(access));
    } else {
      setPermissions(emptyPerms);
    }
    accessResolved.current = true;
    setInitialLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let mounted = true;

    const loadAccess = async (background: boolean) => {
      if (background) {
        setRefreshing(true);
      }
      try {
        const access = await withTimeout(fetchStaffAccess(), AUTH_TIMEOUT_MS, "Staff access");
        if (mounted) applyAccess(access);
      } catch {
        if (mounted) applyAccess(null);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s);
      if (s?.user) {
        await loadAccess(accessResolved.current);
      } else {
        applyAccess(null);
      }
    });

    void withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS, "Auth session")
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          await loadAccess(false);
        } else {
          applyAccess(null);
        }
      })
      .catch(() => {
        if (mounted) applyAccess(null);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        isAdmin,
        isOwner,
        staffRole,
        permissions,
        initialLoading,
        refreshing,
        loading: initialLoading,
        signOut: async () => {
          await supabase.auth.signOut();
          setPermissions(emptyPerms);
          setSession(null);
          setRefreshing(false);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

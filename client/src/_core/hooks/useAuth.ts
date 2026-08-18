import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

const DEMO_SESSION_KEY = "krishai-demo-session";
const DEMO_EVENT = "krishai-demo-auth";

export const DEMO_USER = {
  id: 1,
  openId: "local-demo-admin",
  name: "Demo Administrator",
  email: "demo@krishai.local",
  loginMethod: "password",
  role: "admin" as const,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(),
};

export function isLocalDemoActive() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_SESSION_KEY) === "active";
}

export function activateLocalDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_SESSION_KEY, "active");
  window.dispatchEvent(new Event(DEMO_EVENT));
}

export function clearLocalDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_SESSION_KEY);
  window.dispatchEvent(new Event(DEMO_EVENT));
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const [demoVersion, setDemoVersion] = useState(0);
  const demoActive = typeof window !== "undefined" && isLocalDemoActive();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !demoActive,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => utils.auth.me.setData(undefined, null),
  });

  useEffect(() => {
    const refresh = () => setDemoVersion((version) => version + 1);
    window.addEventListener(DEMO_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DEMO_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const logout = useCallback(async () => {
    if (isLocalDemoActive()) {
      clearLocalDemoSession();
      utils.auth.me.setData(undefined, null);
      return;
    }
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (!(error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED")) throw error;
    } finally {
      try { sessionStorage.removeItem("manus-cookie"); } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const localUser = demoActive ? DEMO_USER : null;
    const user = localUser ?? meQuery.data ?? null;
    try { localStorage.setItem("manus-runtime-user-info", JSON.stringify(user)); } catch {}
    return {
      user,
      loading: demoActive ? false : meQuery.isLoading || logoutMutation.isPending,
      error: demoActive ? null : meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [demoActive, demoVersion, meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || demoActive) return;
    if (meQuery.isLoading || logoutMutation.isPending || state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    window.location.href = redirectPath ?? "/";
  }, [redirectOnUnauthenticated, redirectPath, demoActive, logoutMutation.isPending, meQuery.isLoading, state.user]);

  return { ...state, refresh: () => meQuery.refetch(), logout };
}

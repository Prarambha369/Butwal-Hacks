"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@auth0/nextjs-auth0/types";
import { APP_CREDENTIALS, appUrl } from "@/lib/app-origin";

type AuthUser = { user: User | null | undefined; isLoading: boolean };

const AuthUserContext = createContext<AuthUser>({ user: undefined, isLoading: true });

/** Same route the Auth0 SDK's `useUser` reads. */
const PROFILE_ROUTE = process.env.NEXT_PUBLIC_PROFILE_ROUTE || "/auth/profile";

/** Retries after a failed probe (not a signed-out answer), then give up. */
export const PROFILE_RETRY_DELAYS_MS = [2000, 4000];

type Probe = { kind: "user"; user: User } | { kind: "signed-out" } | { kind: "failed" };

async function probeProfile(): Promise<Probe> {
  try {
    const res = await fetch(appUrl(PROFILE_ROUTE), { credentials: APP_CREDENTIALS });
    // 401 (and 204 on newer SDKs) is the route's answer for "no session".
    if (res.status === 401 || res.status === 204) return { kind: "signed-out" };
    if (!res.ok) return { kind: "failed" };
    return { kind: "user", user: (await res.json()) as User };
  } catch {
    // Network error or a body that is not JSON: we do not know yet.
    return { kind: "failed" };
  }
}

/**
 * AuthUserProvider — reads the session profile once per page load and shares
 * the result. Mount once in the root layout; every component below reads via
 * `useAuthUser()` instead of calling `useUser()` itself (N call sites used to
 * mean N parallel `/auth/profile` requests).
 *
 * A plain fetch rather than the SDK's SWR-based `useUser`: for a signed-out
 * visitor the route answers 401, and SWR treated that as an error and retried
 * it on an exponential backoff for as long as the tab stayed open. Every retry
 * is a page-path request that counts toward the edge firewall's per-IP limit,
 * so an idle tab kept spending it.
 *
 * Only a 401/204 means signed out, and it is never asked again. A failed probe
 * (5xx, network, bad JSON) is retried a fixed number of times with a delay
 * (PROFILE_RETRY_DELAYS_MS), so a blip does not show a signed-in visitor the
 * signed-out UI; after the last one the page settles as signed out rather
 * than loading forever. Signing in or out reloads the page.
 */
export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthUser>({ user: undefined, isLoading: true });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = async (n: number) => {
      const probe = await probeProfile();
      if (cancelled) return;
      if (probe.kind === "user") return setState({ user: probe.user, isLoading: false });
      if (probe.kind === "signed-out" || n >= PROFILE_RETRY_DELAYS_MS.length) {
        return setState({ user: null, isLoading: false });
      }
      timer = setTimeout(() => void attempt(n + 1), PROFILE_RETRY_DELAYS_MS[n]);
    };
    void attempt(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return <AuthUserContext.Provider value={state}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser(): AuthUser {
  return useContext(AuthUserContext);
}

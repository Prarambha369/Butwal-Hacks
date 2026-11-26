"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@auth0/nextjs-auth0/types";

type AuthUser = { user: User | null | undefined; isLoading: boolean };

const AuthUserContext = createContext<AuthUser>({ user: undefined, isLoading: true });

/** Same route the Auth0 SDK's `useUser` reads. */
const PROFILE_ROUTE = process.env.NEXT_PUBLIC_PROFILE_ROUTE || "/auth/profile";

/**
 * AuthUserProvider — reads the session profile exactly once per page load and
 * shares the result. Mount once in the root layout; every component below
 * reads via `useAuthUser()` instead of calling `useUser()` itself (N call
 * sites used to mean N parallel `/auth/profile` requests).
 *
 * One plain fetch rather than the SDK's SWR-based `useUser`: for a signed-out
 * visitor the route answers 401, and SWR treats that as an error and retries
 * it on an exponential backoff for as long as the tab stays open. Every retry
 * is a page-path request that counts toward the edge firewall's per-IP limit,
 * so an idle tab kept spending it. Signing in or out reloads the page, which
 * reads the profile again.
 */
export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthUser>({ user: undefined, isLoading: true });

  useEffect(() => {
    let mounted = true;
    fetch(PROFILE_ROUTE, { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok || res.status === 204) return null;
        return (await res.json()) as User;
      })
      .catch(() => null)
      .then((user) => {
        if (mounted) setState({ user, isLoading: false });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return <AuthUserContext.Provider value={state}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser(): AuthUser {
  return useContext(AuthUserContext);
}

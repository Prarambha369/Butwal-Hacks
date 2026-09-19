"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

type AuthUser = Pick<ReturnType<typeof useUser>, "user" | "isLoading">;

const AuthUserContext = createContext<AuthUser>({ user: undefined, isLoading: true });

/**
 * AuthUserProvider — calls the Auth0 `useUser` hook exactly once per page
 * load and shares the result. Every `useUser()` call site fires its own
 * `/auth/profile` request, so N components meant N parallel requests (and
 * N 401s for logged-out visitors). Mount once in the root layout; every
 * component below reads via `useAuthUser()` instead.
 */
export function AuthUserProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  return (
    <AuthUserContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser(): AuthUser {
  return useContext(AuthUserContext);
}

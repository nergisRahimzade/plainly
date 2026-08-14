import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserPublic } from "../types";
import {
  fetchCurrentUser,
  loginWithApple,
  loginWithEmail,
  loginWithGoogle,
  logout as apiLogout,
  registerWithEmail,
} from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/authStorage";

interface AuthContextValue {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogleToken: (idToken: string) => Promise<void>;
  signInWithAppleToken: (identityToken: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          setUser(await fetchCurrentUser());
        } catch {
          // Token expired/invalid — fall back to guest mode silently.
          await clearToken();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const applyAuth = useCallback(async (token: string, nextUser: UserPublic) => {
    await setToken(token);
    setUser(nextUser);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { token, user: nextUser } = await loginWithEmail(email, password);
      await applyAuth(token, nextUser);
    },
    [applyAuth]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const { token, user: nextUser } = await registerWithEmail(email, password, name);
      await applyAuth(token, nextUser);
    },
    [applyAuth]
  );

  const signInWithGoogleToken = useCallback(
    async (idToken: string) => {
      const { token, user: nextUser } = await loginWithGoogle(idToken);
      await applyAuth(token, nextUser);
    },
    [applyAuth]
  );

  const signInWithAppleToken = useCallback(
    async (identityToken: string, name?: string) => {
      const { token, user: nextUser } = await loginWithApple(identityToken, name);
      await applyAuth(token, nextUser);
    },
    [applyAuth]
  );

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort — the client-side token clear below is what actually matters.
    }
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogleToken,
      signInWithAppleToken,
      signOut,
    }),
    [user, isLoading, signInWithEmail, signUpWithEmail, signInWithGoogleToken, signInWithAppleToken, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

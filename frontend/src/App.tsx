import {
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
} from "react-router-dom";

import {
  getAuthUser,
} from "./auth/auth.storage";

import {
  logout,
  restoreSession,
} from "./auth/auth.service";

import { AuthUser } from "./auth/auth.types";

import AppRouter from "./app/AppRouter";

type AuthState =
  | "checking"
  | "authenticated"
  | "unauthenticated";

export default function App() {
  const [user, setUser] =
    useState<AuthUser | null>(
      () => getAuthUser(),
    );

  const [authState, setAuthState] =
    useState<AuthState>(
      () =>
        getAuthUser()
          ? "authenticated"
          : "checking",
    );

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function validateSession(): Promise<void> {
      const existingUser =
        getAuthUser();

      if (existingUser) {
        if (mounted) {
          setUser(existingUser);
          setAuthState(
            "authenticated",
          );
        }

        return;
      }

      try {
        const restoredUser =
          await restoreSession();

        if (!mounted) {
          return;
        }

        if (restoredUser) {
          setUser(restoredUser);
          setAuthState(
            "authenticated",
          );
          return;
        }

        setUser(null);
        setAuthState(
          "unauthenticated",
        );
      } catch {
        if (!mounted) {
          return;
        }

        setUser(null);
        setAuthState(
          "unauthenticated",
        );
      }
    }

    void validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  function handleAuthenticated(
    authenticatedUser: AuthUser,
  ): void {
    setUser(authenticatedUser);
    setAuthState(
      "authenticated",
    );
  }

  async function handleLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
    } finally {
      setUser(null);
      setAuthState(
        "unauthenticated",
      );
      setLoggingOut(false);
    }
  }

  return (
    <BrowserRouter>
      <AppRouter
        authState={authState}
        user={user}
        onAuthenticated={
          handleAuthenticated
        }
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    </BrowserRouter>
  );
}

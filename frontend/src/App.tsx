import { useEffect, useState } from "react";

import {
  getAuthUser,
} from "./auth/auth.storage";

import {
  getCurrentUser,
  logout,
  restoreSession,
} from "./auth/auth.service";

import { AuthUser } from "./auth/auth.types";

import LoginPage from "./auth/LoginPage";
import AuthApp from "./auth/AuthApp";

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
      "checking",
    );

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {

    let mounted = true;

    async function validateSession(): Promise<void> {

      try {

        const currentUser =
          await getCurrentUser();

        if (
          currentUser
        ) {

          if (mounted) {

            setUser(currentUser);

            setAuthState(
              "authenticated",
            );
          }

          return;
        }

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

    setUser(
      authenticatedUser,
    );

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

  if (
    authState ===
    "checking"
  ) {

    return (
      <main>
        <h1>TITAN Core Platform</h1>

        <p>
          Checking session...
        </p>
      </main>
    );
  }

  if (
    authState ===
    "unauthenticated"
  ) {

    return (
      <LoginPage
        onAuthenticated={
          handleAuthenticated
        }
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthApp
      user={user}
      onLogout={handleLogout}
      loggingOut={loggingOut}
    />
  );
}

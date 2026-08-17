import { useEffect, useState } from "react";

import {
  getAuthUser,
} from "./auth/auth.storage";

import {
  getCurrentUser,
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
    useState<AuthUser | null>(null);

  const [authState, setAuthState] =
    useState<AuthState>(() =>
      getAuthUser()
        ? "checking"
        : "unauthenticated",
    );


  useEffect(() => {

    let mounted = true;

    async function validateSession(): Promise<void> {

      if (!getAuthUser()) {

        if (mounted) {

          setAuthState(
            "unauthenticated",
          );

        }

        return;

      }

      try {

        const currentUser =
          await getCurrentUser();

        if (!mounted) {
          return;
        }

        if (currentUser) {

          setUser(currentUser);

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
    />
  );

}

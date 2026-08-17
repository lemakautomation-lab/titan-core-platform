import { AuthUser } from "./auth.types";

const ACCESS_TOKEN_KEY = "titan.accessToken";
const AUTH_USER_KEY = "titan.authUser";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(
  accessToken: string,
): void {
  sessionStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );
}

export function getAuthUser(): AuthUser | null {
  const value =
    sessionStorage.getItem(AUTH_USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    sessionStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function setAuthUser(
  user: AuthUser,
): void {
  sessionStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user),
  );
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

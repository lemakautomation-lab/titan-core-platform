import { AuthUser } from "./auth.types";

let accessToken: string | null = null;
let authUser: AuthUser | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(
  token: string,
): void {
  accessToken = token;
}

export function getAuthUser(): AuthUser | null {
  return authUser;
}

export function setAuthUser(
  user: AuthUser,
): void {
  authUser = user;
}

export function clearAuthSession(): void {
  accessToken = null;
  authUser = null;
}

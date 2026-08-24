import {
  login as loginApi,
  refresh as refreshApi,
  logout as logoutApi,
  me as meApi,
} from "./auth.api";

import {
  getAccessToken,
  setAccessToken,
  getAuthUser,
  setAuthUser,
  clearAuthSession,
} from "./auth.storage";

import {
  AuthUser,
  LoginRequest,
} from "./auth.types";


export async function login(
  request: LoginRequest,
): Promise<AuthUser> {

  const response =
    await loginApi(request);

  setAccessToken(
    response.data.accessToken,
  );

  setAuthUser(
    response.data.user,
  );

  return response.data.user;

}


export async function refresh(): Promise<string> {

  const response =
    await refreshApi();

  setAccessToken(
    response.data.accessToken,
  );

  return response.data.accessToken;

}


export async function logout(): Promise<void> {

  const accessToken =
    getAccessToken();

  if (!accessToken) {

    clearAuthSession();

    return;

  }

  try {

    await logoutApi();

  } finally {

    clearAuthSession();

  }

}


export async function getCurrentUser(): Promise<AuthUser | null> {

  const accessToken =
    getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {

    const response =
      await meApi();

    const cachedUser =
      getAuthUser();

    if (
      cachedUser &&
      cachedUser.id === response.userId &&
      cachedUser.tenantId === response.tenantId
    ) {

      return cachedUser;

    }

    clearAuthSession();

    return null;

  } catch {

    clearAuthSession();

    return null;

  }

}


export function isAuthenticated(): boolean {

  return getAccessToken() !== null;

}


export function clearSession(): void {

  clearAuthSession();

}

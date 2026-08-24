import { apiRequest } from "../api/client";

import {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
} from "./auth.types";


export function login(
  request: LoginRequest,
): Promise<LoginResponse> {

  return apiRequest<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

}


export function refresh(): Promise<RefreshResponse> {

  return apiRequest<RefreshResponse>(
    "/auth/refresh",
    {
      method: "POST",
    },
  );

}


export function logout(): Promise<LogoutResponse> {

  return apiRequest<LogoutResponse>(
    "/auth/logout",
    {
      method: "POST",
    },
  );

}


export function me(): Promise<MeResponse> {

  return apiRequest<MeResponse>(
    "/auth/me",
    {
      method: "GET",
    },
  );

}

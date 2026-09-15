import { apiRequest } from "../api/client";

import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
  RegisterAthleteRequest,
  RegisterAthleteResponse,
} from "./auth.types";


export function registerAthlete(
  request: RegisterAthleteRequest,
): Promise<RegisterAthleteResponse> {

  return apiRequest<RegisterAthleteResponse>(
    "/auth/register/athlete",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

}


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

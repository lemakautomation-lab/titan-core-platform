import { apiRequest } from "../api/client";

import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
  RegisterAthleteRequest,
  RegisterAthleteResponse,
  RegisterTrainerRequest,
  RegisterTrainerResponse,
  PasswordResetRequest,
  PasswordResetCompleteRequest,
  PasswordResetResponse,} from "./auth.types";


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



export function registerTrainer(
  request: RegisterTrainerRequest,
): Promise<RegisterTrainerResponse> {
  return apiRequest<RegisterTrainerResponse>(
    "/auth/register/trainer",
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

export function requestPasswordReset(
  request: PasswordResetRequest,
): Promise<PasswordResetResponse> {
  return apiRequest<PasswordResetResponse>(
    "/auth/password-reset/request",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function completePasswordReset(
  request: PasswordResetCompleteRequest,
): Promise<PasswordResetResponse> {
  return apiRequest<PasswordResetResponse>(
    "/auth/password-reset/complete",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}
export interface AccountAssistanceApiResponse {
  data: {
    reference: string;
    expiresAt: string;
    message: string;
  };
}

export function requestAccountAssistance():
Promise<AccountAssistanceApiResponse> {
  return apiRequest<AccountAssistanceApiResponse>(
    "/auth/account-assistance/request",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}
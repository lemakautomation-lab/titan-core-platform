import { apiRequest } from "../api/client";

export interface TrainerClientDto {
  readonly athleteId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly countryCode: string | null;
  readonly status: string;
  readonly relationshipId: string;
  readonly relationshipStatus: string;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
}

interface AddTrainerClientResponse {
  readonly relationshipId: string;
}

export function getMyTrainerClients():
Promise<TrainerClientDto[]> {
  return apiRequest<TrainerClientDto[]>(
    "/auth/me/trainer-clients",
    {
      method: "GET",
    },
  );
}

export function addMyTrainerClient(
  athleteId: string,
): Promise<AddTrainerClientResponse> {
  return apiRequest<AddTrainerClientResponse>(
    `/auth/me/trainer-clients/${encodeURIComponent(
      athleteId,
    )}`,
    {
      method: "POST",
    },
  );
}

export function removeMyTrainerClient(
  athleteId: string,
): Promise<void> {
  return apiRequest<void>(
    `/auth/me/trainer-clients/${encodeURIComponent(
      athleteId,
    )}`,
    {
      method: "DELETE",
    },
  );
}

export interface TrainerClientProfileDto {
  athleteId: string;
  firstName: string;
  lastName: string;
  countryCode: string | null;
  status: string;
  relationshipId: string;
  relationshipStatus: string;
  relationshipStartsAt: string | null;
}

export async function getMyTrainerClientProfile(
  athleteId: string,
): Promise<TrainerClientProfileDto> {
  const response = await fetch(
    `/api/v1/auth/me/trainer-clients/${encodeURIComponent(athleteId)}/profile`,
    {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Trainer client profile could not be loaded.",
    );
  }

  return response.json();
}
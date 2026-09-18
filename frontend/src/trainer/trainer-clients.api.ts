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

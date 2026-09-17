import { apiRequest } from "../api/client";

export type TrainerAccessReason =
  | "GRANTED"
  | "TRAINER_TYPE_REQUIRED"
  | "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED";

export interface TrainerAccessDto {
  readonly accessGranted: boolean;
  readonly reason: TrainerAccessReason;
}

export function getMyTrainerAccess(): Promise<TrainerAccessDto> {
  return apiRequest<TrainerAccessDto>(
    "/auth/me/trainer-access",
    {
      method: "GET",
    },
  );
}

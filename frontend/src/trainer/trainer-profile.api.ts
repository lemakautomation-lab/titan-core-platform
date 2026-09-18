import { apiRequest } from "../api/client";

export interface TrainerProfileDto {
  readonly id: string;
  readonly professionalTitle: string | null;
  readonly bio: string | null;
  readonly qualifications: string | null;
  readonly specialisations: string | null;
  readonly yearsExperience: number | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateTrainerProfileInput {
  readonly professionalTitle: string | null;
  readonly bio: string | null;
  readonly qualifications: string | null;
  readonly specialisations: string | null;
  readonly yearsExperience: number | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
}

export function getMyTrainerProfile():
Promise<TrainerProfileDto | null> {
  return apiRequest<TrainerProfileDto | null>(
    "/auth/me/trainer-profile",
    {
      method: "GET",
    },
  );
}

export function updateMyTrainerProfile(
  input: UpdateTrainerProfileInput,
): Promise<TrainerProfileDto> {
  return apiRequest<TrainerProfileDto>(
    "/auth/me/trainer-profile",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

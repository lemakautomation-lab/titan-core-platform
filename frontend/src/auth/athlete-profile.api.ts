import { apiRequest } from "../api/client";

export interface AthletePersonalDetails {
  userId: string;
  athleteId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string | null;
  countryCode: string | null;
  dateOfBirth: string | null;
}

export interface PersonalDetailsUpdate {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string | null;
  countryCode: string;
  dateOfBirth: string | null;
}

export function getMyPersonalDetails(): Promise<AthletePersonalDetails> {
  return apiRequest<AthletePersonalDetails>("/auth/me/personal-details", { method: "GET" });
}

export function updateMyPersonalDetails(
  details: PersonalDetailsUpdate,
): Promise<AthletePersonalDetails> {
  return apiRequest<AthletePersonalDetails>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(details),
  });
}

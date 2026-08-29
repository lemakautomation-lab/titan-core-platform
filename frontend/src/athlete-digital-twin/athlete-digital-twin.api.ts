import { apiRequest } from "../api/client";

export interface AthleteDigitalTwinDto {
  id: string;
  tenantId: string;
  athleteId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAthleteDigitalTwinByAthleteId(
  athleteId: string,
): Promise<AthleteDigitalTwinDto> {
  return apiRequest<AthleteDigitalTwinDto>(
    `/athlete-digital-twin/athlete/${athleteId}`,
  );
}

export async function getAthleteDigitalTwinById(
  id: string,
): Promise<AthleteDigitalTwinDto> {
  return apiRequest<AthleteDigitalTwinDto>(
    `/athlete-digital-twin/${id}`,
  );
}

export async function createAthleteDigitalTwin(
  athleteId: string,
): Promise<AthleteDigitalTwinDto> {
  return apiRequest<AthleteDigitalTwinDto>(
    "/athlete-digital-twin",
    {
      method: "POST",
      body: JSON.stringify({
        athleteId,
      }),
    },
  );
}

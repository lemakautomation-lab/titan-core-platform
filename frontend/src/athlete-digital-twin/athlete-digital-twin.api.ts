import { apiRequest } from "../api/client";

export interface AthleteDigitalTwinDto {
  id: string;
  tenantId: string;
  athleteId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type AthleteDigitalTwinLifecycleAction =
  | "ACTIVATE"
  | "DEACTIVATE"
  | "SUSPEND"
  | "DELETE";

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

export async function updateAthleteDigitalTwinLifecycle(
  id: string,
  action: AthleteDigitalTwinLifecycleAction,
): Promise<AthleteDigitalTwinDto> {
  return apiRequest<AthleteDigitalTwinDto>(
    `/athlete-digital-twin/${id}/lifecycle`,
    {
      method: "PATCH",
      body: JSON.stringify({
        action,
      }),
    },
  );
}

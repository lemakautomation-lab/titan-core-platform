import { apiRequest } from "../api/client";

export interface DepartmentCommandCentre {
  organisationId: string;
  organisationName: string;
  staffCount: number;
  athleteCount: number;
}

export function getDepartmentCommandCentre(): Promise<DepartmentCommandCentre> {
  return apiRequest<DepartmentCommandCentre>("/performance-director/command-centre");
}

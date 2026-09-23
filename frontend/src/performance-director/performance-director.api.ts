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

export type IntelligenceWindow = 7 | 30 | 90;

export interface DepartmentPerformanceIntelligence {
  organisationId: string;
  days: IntelligenceWindow;
  activeAthleteCount: number;
  measuredAthleteCount: number;
  effectiveMeasurementCount: number;
  latestMeasurementAt: string | null;
}

export function getDepartmentPerformanceIntelligence(days: IntelligenceWindow) {
  return apiRequest<DepartmentPerformanceIntelligence>(
    `/performance-director/intelligence?days=${days}`,
  );
}

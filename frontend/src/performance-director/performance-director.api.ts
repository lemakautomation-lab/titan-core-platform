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

export interface DepartmentTeamsPage {
  organisationId: string;
  teams: Array<{ id: string; name: string }>;
  nextCursor: string | null;
}

export function getDepartmentTeams(cursor?: string): Promise<DepartmentTeamsPage> {
  return apiRequest<DepartmentTeamsPage>(
    `/performance-director/teams?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
}

export interface DepartmentRoleReport {
  organisationId: string;
  organisationName: string;
  days: IntelligenceWindow;
  staffCount: number;
  activeAthleteCount: number;
  measuredAthleteCount: number;
  effectiveMeasurementCount: number;
  latestMeasurementAt: string | null;
}

export function getDepartmentRoleReport(days: IntelligenceWindow): Promise<DepartmentRoleReport> {
  return apiRequest<DepartmentRoleReport>(`/performance-director/report?days=${days}`);
}

export type DepartmentDecisionAction =
  | "NO_ACTIVE_ATHLETES"
  | "COLLECT_MEASUREMENTS"
  | "REVIEW_MEASUREMENT_COVERAGE"
  | "REVIEW_MEASUREMENT_ACTIVITY";

export interface DepartmentDecisionSupport {
  organisationId: string;
  days: IntelligenceWindow;
  activeAthleteCount: number;
  measuredAthleteCount: number;
  effectiveMeasurementCount: number;
  action: DepartmentDecisionAction;
}

export function getDepartmentDecisionSupport(days: IntelligenceWindow): Promise<DepartmentDecisionSupport> {
  return apiRequest<DepartmentDecisionSupport>(`/performance-director/decision-support?days=${days}`);
}

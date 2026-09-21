import { apiRequest } from "../api/client";

export interface PerformanceProfessionalWorkflowDto {
  athleteId: string;
  performance: Array<{
    metric: unknown;
    measurements: unknown[];
  }>;
  recovery: unknown[];
  trainingStress: unknown[];
  workoutProgrammes: unknown[];
}

export function getSportsScientistWorkflow(
  athleteId: string,
  limit = 25,
): Promise<PerformanceProfessionalWorkflowDto> {
  return apiRequest<PerformanceProfessionalWorkflowDto>(
    `/performance-professional/athletes/${encodeURIComponent(
      athleteId,
    )}/workflow?limit=${limit}`,
  );
}

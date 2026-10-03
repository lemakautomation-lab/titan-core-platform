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

export interface StrengthConditioningWorkflowDto {
  athleteId: string;
  trainingStress: unknown[];
  workoutProgrammes: unknown[];
}

export function getStrengthConditioningWorkflow(
  athleteId: string,
  limit = 25,
): Promise<StrengthConditioningWorkflowDto> {
  return apiRequest<StrengthConditioningWorkflowDto>(
    `/performance-professional/athletes/${encodeURIComponent(
      athleteId,
    )}/strength-conditioning?limit=${limit}`,
  );
}

export interface NutritionProfessionalWorkflowDto {
  athleteId: string;
  latestNutritionPlan: {
    id: string;
    athleteId: string;
    generatorId: string;
    generatorVersion: string;
    planSnapshot: {
      planType: "AUTOMATED_NUTRITION_PLAN";
      goalClassification?:
        | "GENERAL_FITNESS"
        | "SPORT_PERFORMANCE";
      macroTargets: {
        caloriesKcal: number;
        proteinGrams: number;
        carbohydrateGrams: number;
        fatGrams: number;
      };
      hydrationGuidance: {
        dailyWaterLitres: number;
        unit: "LITRES_PER_DAY";
      };
      guidance: readonly string[];
    };
    createdAt: string;
  } | null;
}

export function getNutritionProfessionalWorkflow(
  athleteId: string,
): Promise<NutritionProfessionalWorkflowDto> {
  return apiRequest<NutritionProfessionalWorkflowDto>(
    `/performance-professional/athletes/${encodeURIComponent(
      athleteId,
    )}/nutrition`,
  );
}

export interface RehabilitationProfessionalWorkflowDto {
  athleteId: string;
  recovery: unknown[];
}

export function getRehabilitationProfessionalWorkflow(
  athleteId: string,
  limit = 25,
): Promise<RehabilitationProfessionalWorkflowDto> {
  return apiRequest<RehabilitationProfessionalWorkflowDto>(
    `/performance-professional/athletes/${encodeURIComponent(
      athleteId,
    )}/rehabilitation?limit=${limit}`,
  );
}

export interface PerformanceProfessionalAiAssistanceDto {
  status: "GENERATED" | "INSUFFICIENT_DATA";
  assistance: {
    summary: string;
    observations: string[];
    considerations: string[];
  } | null;
  confidence: "NOT_ASSESSED";
  professionalReviewRequired: true;
  automaticAction: false;
  explanation: {
    retrievedAt: string;
    provenance: {
      performanceMetricCount: number;
      performanceMeasurementCount: number;
      recoveryObservationCount: number;
      trainingStressObservationCount: number;
      workoutProgrammeCount: number;
    };
  };
  limitations: string[];
  generatedAt: string;
}

export interface PerformanceProfessionalAiResponse {
  data: PerformanceProfessionalAiAssistanceDto;
}

export function generatePerformanceProfessionalAiAssistance(
  athleteId: string,
): Promise<PerformanceProfessionalAiResponse> {
  return apiRequest<PerformanceProfessionalAiResponse>(
    `/performance-professional/athletes/${encodeURIComponent(
      athleteId,
    )}/ai-assistance`,
    {
      method: "POST",
      body: JSON.stringify({
        acknowledgement: true,
      }),
    },
  );
}
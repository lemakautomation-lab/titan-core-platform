import { apiRequest } from "../api/client";

export type CoachAiQueryType =
  | "SQUAD_INTELLIGENCE"
  | "TRAINING_SUPPORT"
  | "PERFORMANCE_QUERY";

export type CoachAiTargetType =
  | "SQUAD"
  | "ATHLETE";

export interface CoachAiFacts {
  targetType: CoachAiTargetType;
  squad: {
    memberCount: number;
    performanceMetricCount: number;
    performanceMeasurementCount: number;
    workoutProgrammeCount: number;
    trendMetrics: Array<{
      metricSlug: string;
      unit: string | null;
      athleteCount: number;
      pointCount: number;
      averageValue: number;
      minimumValue: number;
      maximumValue: number;
    }>;
    trainingLoad: {
      athletesWithObservations: number;
      observationCount: number;
      latestAverageValue: number | null;
    };
  } | null;
  athlete: {
    performanceTrends: Array<{
      metricSlug: string;
      unit: string | null;
      latestValue: number;
      previousValue: number | null;
      delta: number | null;
      direction:
        | "UP"
        | "DOWN"
        | "UNCHANGED"
        | "INSUFFICIENT_DATA";
      measurementCount: number;
    }>;
    trainingLoad: {
      observationCount: number;
      latestValue: number | null;
      previousValue: number | null;
      delta: number | null;
      direction:
        | "UP"
        | "DOWN"
        | "UNCHANGED"
        | "INSUFFICIENT_DATA";
    };
    programmes: Array<{
      trainingFrequency: number;
      sessionDurationMinutes: number;
      status: string;
    }>;
  } | null;
}

export interface CoachAiAssistanceResponse {
  data: {
    status: "GENERATED" | "INSUFFICIENT_DATA";
    queryType: CoachAiQueryType;
    targetType: CoachAiTargetType;
    assistance: {
      summary: string;
      observations: string[];
      considerations: string[];
    } | null;
    explanation: {
      version: 1;
      retrievedAt: string;
      facts: CoachAiFacts;
      sources: {
        squad:
          | "USED"
          | "NOT_APPLICABLE"
          | "NO_USABLE_FACTS";
        performance:
          | "USED"
          | "NOT_APPLICABLE"
          | "NO_USABLE_FACTS";
        trainingLoad:
          | "USED"
          | "NOT_APPLICABLE"
          | "NO_USABLE_FACTS";
        programmes:
          | "USED"
          | "NOT_APPLICABLE"
          | "NO_USABLE_FACTS";
      };
    };
    limitations: {
      confidence: "NOT_ASSESSED";
      notices: string[];
    };
    generatedAt: string;
  };
}

const endpointByTask: Record<
  CoachAiQueryType,
  string
> = {
  SQUAD_INTELLIGENCE:
    "/ai-coach-assistant/squad-intelligence",
  TRAINING_SUPPORT:
    "/ai-coach-assistant/training-support",
  PERFORMANCE_QUERY:
    "/ai-coach-assistant/performance-query",
};

export function generateCoachAiAssistance(
  targetId: string,
  queryType: CoachAiQueryType,
): Promise<CoachAiAssistanceResponse> {
  return apiRequest<CoachAiAssistanceResponse>(
    endpointByTask[queryType],
    {
      method: "POST",
      body: JSON.stringify({
        targetId,
        acknowledgement: true,
      }),
    },
  );
}

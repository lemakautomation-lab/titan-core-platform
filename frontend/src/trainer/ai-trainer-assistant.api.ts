import { apiRequest } from "../api/client";

export type TrainerAiQueryType =
  | "ADHERENCE"
  | "PERFORMANCE_TRENDS"
  | "PROGRAMME_PROPOSAL"
  | "PROGRESS_REPORT";

export interface TrainerAiFacts {
  adherence: {
    windowDays: 28;
    totalPastSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    unresolvedPastSessions: number;
    completionRatePercent: number | null;
  };
  performanceTrends: Array<{
    metricSlug: string;
    unit: string | null;
    latestValue: number;
    previousValue: number | null;
    delta: number | null;
    direction: "UP" | "DOWN" | "UNCHANGED" | "INSUFFICIENT_DATA";
    measurementCount: number;
  }>;
  programmes: Array<{
    trainingFrequency: number;
    sessionDurationMinutes: number;
    status: string;
  }>;
}

export interface TrainerAiAssistanceResponse {
  data: {
    status: "GENERATED" | "INSUFFICIENT_DATA";
    queryType: TrainerAiQueryType;
    assistance: {
      summary: string;
      observations: string[];
      considerations: string[];
    } | null;
    explanation: {
      version: 1;
      retrievedAt: string;
      facts: TrainerAiFacts;
      sources: {
        adherence: "USED" | "NO_USABLE_FACTS";
        performance: "USED" | "NO_USABLE_FACTS";
        programmes: "USED" | "NO_USABLE_FACTS";
      };
    };
    limitations: {
      confidence: "NOT_ASSESSED";
      notices: string[];
    };
    generatedAt: string;
  };
}

export function generateTrainerAiAssistance(
  athleteId: string,
  queryType: TrainerAiQueryType,
): Promise<TrainerAiAssistanceResponse> {
  return apiRequest<TrainerAiAssistanceResponse>(
    "/ai-trainer-assistant/query",
    {
      method: "POST",
      body: JSON.stringify({
        athleteId,
        queryType,
        acknowledgement: true,
      }),
    },
  );
}

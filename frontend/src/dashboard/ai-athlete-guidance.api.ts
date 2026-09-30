import { apiRequest } from "../api/client";

export interface AthleteGuidanceResult {
  data: {
    status: "GENERATED" | "INSUFFICIENT_DATA";
    guidance: { summary: string; actions: string[] } | null;
    generatedAt: string;
    explanation: {
      version: 1;
      retrievedAt: string;
      facts: { goals: string[]; trainingFrequencies: number[] };
      sources: {
        goals: "WITHHELD" | "NO_USABLE_FACTS" | "USED";
        training: "WITHHELD" | "NO_USABLE_FACTS" | "USED";
      };
    };
  };
}

export function generateMyAthleteGuidance() {
  return apiRequest<AthleteGuidanceResult>("/ai-athlete-assistant/guidance", {
    method: "POST",
    body: JSON.stringify({ consent: true }),
  });
}

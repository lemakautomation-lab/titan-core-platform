import { apiRequest } from "../api/client";

export interface AthleteGuidanceResult {
  data: {
    status: "GENERATED" | "INSUFFICIENT_DATA";
    guidance: { summary: string; actions: string[] } | null;
    generatedAt: string;
  };
}

export function generateMyAthleteGuidance() {
  return apiRequest<AthleteGuidanceResult>("/ai-athlete-assistant/guidance", {
    method: "POST",
    body: JSON.stringify({ consent: true }),
  });
}

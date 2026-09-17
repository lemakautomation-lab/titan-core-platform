import { apiRequest } from "../api/client";

export interface RelevantContextDto {
  body: unknown;
  recovery: {
    latest: { value: number; recordedAt: string } | null;
  };
  nutrition: {
    latest: {
      goalClassification?: string;
      macroTargets: { caloriesKcal: number; proteinGrams: number; carbohydrateGrams: number; fatGrams: number };
      hydrationGuidance: { dailyWaterLitres: number; unit: "LITRES_PER_DAY" };
      createdAt: string;
    } | null;
  };
}

export function getMyRelevantContext(): Promise<RelevantContextDto> {
  return apiRequest<RelevantContextDto>("/auth/me/relevant-context", {
    method: "GET",
  });
}

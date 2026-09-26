import { apiRequest } from "../api/client";

export type PerformanceBodyModelType =
  | "MALE"
  | "FEMALE";

export interface PerformanceBodyMeasurementDto {
  id: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bodyFatPercentage: number | null;
  recordedAt: string;
}

export interface AthletePerformanceBodyProfileDto {
  athleteId: string;
  tenantId: string;
  modelType: PerformanceBodyModelType | null;
  measurements:
    PerformanceBodyMeasurementDto[];
}

export function getMyPerformanceBodyProfile():
Promise<AthletePerformanceBodyProfileDto> {
  return apiRequest<AthletePerformanceBodyProfileDto>(
    "/auth/me/performance-body",
    {
      method: "GET",
    },
  );
}

export function updateMyPerformanceBodyModel(
  modelType: PerformanceBodyModelType,
): Promise<{
  athleteId: string;
  tenantId: string;
  modelType: PerformanceBodyModelType;
}> {
  return apiRequest(
    "/auth/me/body-model",
    {
      method: "PUT",
      body: JSON.stringify({
        modelType,
      }),
    },
  );
}

export interface NewBodyMeasurement {
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number;
}

export function recordMyBodyMeasurement(
  measurement: NewBodyMeasurement,
): Promise<PerformanceBodyMeasurementDto> {
  return apiRequest<PerformanceBodyMeasurementDto>(
    "/auth/me/body-measurements",
    {
      method: "POST",
      body: JSON.stringify(measurement),
    },
  );
}

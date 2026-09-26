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
  bodyFatMethod?: BodyFatMethod | null;
  bodyFatSource?: "ATHLETE_MANUAL" | null;
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

export type BodyFatMethod =
  | "BIOELECTRICAL_IMPEDANCE"
  | "DEXA"
  | "SKINFOLD_CALIPER"
  | "CLINICAL_ASSESSMENT";

export interface NewBodyMeasurement {
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number;
  bodyFatMethod?: BodyFatMethod;
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

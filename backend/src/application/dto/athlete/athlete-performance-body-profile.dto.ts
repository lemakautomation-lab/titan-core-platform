import { PerformanceBodyModelType } from "../../../domain/enums/performance-body-model-type.enum";

export interface AthletePerformanceBodyMeasurementDto {
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
        AthletePerformanceBodyMeasurementDto[];
}
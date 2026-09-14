export interface AthleteBodyMeasurementDto {
    id: string;
    athleteId: string;
    tenantId: string;
    heightCm: number;
    weightKg: number;
    bmi: number;
    bodyFatPercentage: number | null;
    recordedAt: string;
    createdAt: string;
}
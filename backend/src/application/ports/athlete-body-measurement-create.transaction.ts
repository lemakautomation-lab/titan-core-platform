import { AthleteBodyMeasurementDto } from "../dto/athlete/athlete-body-measurement.dto";

export interface AthleteBodyMeasurementCreateInput {
    userId: string;
    tenantId: string;
    heightCm: unknown;
    weightKg: unknown;
    bodyFatPercentage: unknown;
    recordedAt: unknown;
    bodyFatMethod?: unknown;
}

export interface AthleteBodyMeasurementCreateTransaction {
    execute(
        input: Readonly<AthleteBodyMeasurementCreateInput>,
    ): Promise<AthleteBodyMeasurementDto>;
}
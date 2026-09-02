export interface PerformanceMeasurementDto {
    id: string;
    athleteId: string;
    metricId: string;
    value: number;
    recordedAt: string;
    createdAt: string;
    sourceType: string | null;
    sourceId: string | null;
    sourceObservationId: string | null;
    correctsMeasurementId: string | null;
}

import { PerformanceMeasurement } from "../../entities/performance-measurement/performance-measurement.entity";

export interface PerformanceMeasurementRepository {

    createIdempotently(
        measurement: PerformanceMeasurement,
    ): Promise<
        | { kind: "created"; measurement: PerformanceMeasurement }
        | { kind: "replayed"; measurement: PerformanceMeasurement }
        | { kind: "idempotency-conflict" }
        | { kind: "correction-conflict" }
    >;

    findCorrectionTarget(
        id: string,
        tenantId: string,
        athleteId: string,
        metricId: string,
    ): Promise<PerformanceMeasurement | null>;

    listRecentForMetric(
        tenantId: string,
        athleteId: string,
        metricId: string,
        limit: number,
    ): Promise<PerformanceMeasurement[]>;

    listRecentEffectiveForMetric(
        tenantId: string,
        athleteId: string,
        metricId: string,
        limit: number,
    ): Promise<PerformanceMeasurement[]>;
}

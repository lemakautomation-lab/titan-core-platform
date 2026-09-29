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
        id: string, tenantId: string, athleteId: string, metricId: string,
    ): Promise<PerformanceMeasurement | null>;
    listRecentForMetric(
        tenantId: string, athleteId: string, metricId: string, limit: number,
    ): Promise<PerformanceMeasurement[]>;
    listRecentEffectiveForMetric(
        tenantId: string, athleteId: string, metricId: string, limit: number,
    ): Promise<PerformanceMeasurement[]>;
    findLatestEffectiveAfter(
        tenantId: string, athleteId: string, metricId: string,
        after: Date, asOf: Date,
    ): Promise<PerformanceMeasurement | null>;
    /**
     * Effective measurements in (asOf - lookbackDays, asOf].
     * Both recordedAt and createdAt must be no later than asOf.
     * Corrections created after asOf cannot change the historical snapshot.
     */
    listEffectiveHistoryForBaseline(
        tenantId: string, athleteId: string, metricId: string,
        asOf: Date, lookbackDays: number,
    ): Promise<PerformanceMeasurement[]>;
}

export type PerformanceMeasurementCreateOutcome = Awaited<
    ReturnType<PerformanceMeasurementRepository["createIdempotently"]>
>;

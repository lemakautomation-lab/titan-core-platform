import { PerformanceMeasurement } from "../../entities/performance-measurement/performance-measurement.entity";

export interface PerformanceMeasurementRepository {

    create(
        measurement: PerformanceMeasurement,
    ): Promise<PerformanceMeasurement>;

    listRecentForMetric(
        tenantId: string,
        athleteId: string,
        metricId: string,
        limit: number,
    ): Promise<PerformanceMeasurement[]>;
}

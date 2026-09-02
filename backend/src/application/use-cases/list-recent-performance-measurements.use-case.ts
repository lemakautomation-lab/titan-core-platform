import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { PerformanceMeasurement } from "../../domain/entities/performance-measurement/performance-measurement.entity";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export interface ListRecentPerformanceMeasurementsQuery {
    tenantId: string;
    athleteId: string;
    metricId: string;
    limit: number;
}

export class ListRecentPerformanceMeasurementsUseCase
implements UseCase<
    ListRecentPerformanceMeasurementsQuery,
    Result<PerformanceMeasurement[]>
> {

    constructor(
        private readonly measurementRepository:
            PerformanceMeasurementRepository,

        private readonly athleteRepository:
            AthleteRepository,

        private readonly metricRepository:
            PerformanceMetricRepository,
    ) {}

    async execute(
        query: ListRecentPerformanceMeasurementsQuery,
    ): Promise<Result<PerformanceMeasurement[]>> {

        if (
            !Number.isInteger(query.limit) ||
            query.limit <= 0
        ) {
            return Result.failure(
                "Performance measurement limit must be positive.",
            );
        }

        const athlete =
            await this.athleteRepository.findById(
                query.athleteId,
                query.tenantId,
            );

        if (!athlete) {
            return Result.failure(
                "Athlete not found.",
            );
        }

        const metric =
            await this.metricRepository.findById(
                query.metricId,
                query.tenantId,
            );

        if (!metric) {
            return Result.failure(
                "Performance metric not found.",
            );
        }

        if (metric.athleteId !== query.athleteId) {
            return Result.failure(
                "Performance metric does not belong to athlete.",
            );
        }

        const measurements =
            await this.measurementRepository.listRecentForMetric(
                query.tenantId,
                query.athleteId,
                query.metricId,
                query.limit,
            );

        return Result.success(measurements);
    }
}

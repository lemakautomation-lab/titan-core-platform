import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { PerformanceMeasurement } from "../../domain/entities/performance-measurement/performance-measurement.entity";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export interface CreatePerformanceMeasurementCommand {
    tenantId: string;
    athleteId: string;
    metricId: string;
    value: number;
    recordedAt?: Date;
}

export class CreatePerformanceMeasurementUseCase
implements UseCase<
    CreatePerformanceMeasurementCommand,
    Result<PerformanceMeasurement>
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
        command: CreatePerformanceMeasurementCommand,
    ): Promise<Result<PerformanceMeasurement>> {

        const athlete =
            await this.athleteRepository.findById(
                command.athleteId,
                command.tenantId,
            );

        if (!athlete) {
            return Result.failure(
                "Athlete not found.",
            );
        }

        const metric =
            await this.metricRepository.findById(
                command.metricId,
                command.tenantId,
            );

        if (!metric) {
            return Result.failure(
                "Performance metric not found.",
            );
        }

        if (metric.athleteId !== command.athleteId) {
            return Result.failure(
                "Performance metric does not belong to athlete.",
            );
        }

        try {

            const measurement =
                PerformanceMeasurement.create(
                    command.tenantId,
                    command.athleteId,
                    command.metricId,
                    command.value,
                    command.recordedAt,
                );

            const created =
                await this.measurementRepository.create(
                    measurement,
                );

            return Result.success(created);

        } catch (error) {

            if (error instanceof Error) {
                return Result.failure(error.message);
            }

            throw error;
        }
    }
}

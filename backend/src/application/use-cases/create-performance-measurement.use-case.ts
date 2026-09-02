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
    sourceType: string;
    sourceId: string;
    sourceObservationId: string;
    correctsMeasurementId?: string | null;
}

export interface CreatePerformanceMeasurementResult {
    measurement: PerformanceMeasurement;
    replayed: boolean;
}

export class CreatePerformanceMeasurementUseCase
implements UseCase<
    CreatePerformanceMeasurementCommand,
    Result<CreatePerformanceMeasurementResult>
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
    ): Promise<Result<CreatePerformanceMeasurementResult>> {

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

        if (command.correctsMeasurementId) {
            const target = await this.measurementRepository.findCorrectionTarget(
                command.correctsMeasurementId,
                command.tenantId,
                command.athleteId,
                command.metricId,
            );
            if (!target) {
                return Result.failure("Correction target not found.");
            }
        }

        try {

            const measurement =
                PerformanceMeasurement.create(
                    command.tenantId,
                    command.athleteId,
                    command.metricId,
                    command.value,
                    command.recordedAt,
                    command.sourceType,
                    command.sourceId,
                    command.sourceObservationId,
                    command.correctsMeasurementId,
                );

            if (
                metric.dataType === "INTEGER" &&
                !Number.isInteger(measurement.value)
            ) {
                return Result.failure(
                    "INTEGER performance measurements must be integral.",
                );
            }

            const outcome =
                await this.measurementRepository.createIdempotently(
                    measurement,
                );
            if (outcome.kind === "idempotency-conflict") {
                return Result.failure("Performance observation identity already exists with different data.");
            }
            if (outcome.kind === "correction-conflict") {
                return Result.failure("Performance measurement has already been corrected.");
            }
            return Result.success({
                measurement: outcome.measurement,
                replayed: outcome.kind === "replayed",
            });

        } catch (error) {

            if (error instanceof Error) {
                return Result.failure(error.message);
            }

            throw error;
        }
    }
}

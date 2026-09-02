import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { PerformanceMeasurement } from "../../domain/entities/performance-measurement/performance-measurement.entity";
import { PerformanceMeasurementCorrectionTransaction } from "../ports/performance-measurement-correction.transaction";
import { CreatePerformanceMeasurementResult } from "./create-performance-measurement.use-case";
import { Result } from "../common/result";

export interface CreatePerformanceMeasurementCorrectionCommand {
    tenantId: string;
    actorUserId: string;
    correctsMeasurementId: string;
    athleteId: string;
    metricId: string;
    value: number;
    recordedAt?: Date;
    sourceObservationId: string;
}

export class CreatePerformanceMeasurementCorrectionUseCase {
    constructor(
        private readonly measurementRepository: PerformanceMeasurementRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly metricRepository: PerformanceMetricRepository,
        private readonly transaction: PerformanceMeasurementCorrectionTransaction,
    ) {}

    async execute(command: CreatePerformanceMeasurementCorrectionCommand): Promise<Result<CreatePerformanceMeasurementResult>> {
        const athlete = await this.athleteRepository.findById(command.athleteId, command.tenantId);
        if (!athlete) return Result.failure("Athlete not found.");
        const metric = await this.metricRepository.findById(command.metricId, command.tenantId);
        if (!metric || metric.athleteId !== command.athleteId) {
            return Result.failure("Performance metric not found.");
        }
        const target = await this.measurementRepository.findCorrectionTarget(
            command.correctsMeasurementId, command.tenantId, command.athleteId, command.metricId,
        );
        if (!target) return Result.failure("Correction target not found.");

        try {
            const measurement = PerformanceMeasurement.create(
                command.tenantId, command.athleteId, command.metricId, command.value,
                command.recordedAt, "USER", command.actorUserId,
                command.sourceObservationId, command.correctsMeasurementId,
            );
            if (metric.dataType === "INTEGER" && !Number.isInteger(measurement.value)) {
                return Result.failure("INTEGER performance measurements must be integral.");
            }
            const outcome = await this.transaction.execute({ measurement, actorUserId: command.actorUserId });
            if (outcome.kind === "idempotency-conflict") {
                return Result.failure("Performance observation identity already exists with different data.");
            }
            if (outcome.kind === "correction-conflict") {
                return Result.failure("Performance measurement has already been corrected.");
            }
            return Result.success({ measurement: outcome.measurement, replayed: outcome.kind === "replayed" });
        } catch (error) {
            return Result.failure(error instanceof Error ? error.message : "Unable to create correction.");
        }
    }
}

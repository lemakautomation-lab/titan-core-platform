import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { AdaptWorkoutProgrammeFromPerformanceCommand } from "../commands/adapt-workout-programme-from-performance.command";
import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";
import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";
import { WorkoutProgrammePerformanceAdaptationTransaction } from "../ports/workout-programme-performance-adaptation.transaction";

export class AdaptWorkoutProgrammeFromPerformanceUseCase
implements UseCase<
    AdaptWorkoutProgrammeFromPerformanceCommand,
    Result<WorkoutProgrammeDto>
> {

    constructor(
        private readonly workoutProgrammeRepository:
            WorkoutProgrammeRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly metricRepository: PerformanceMetricRepository,
        private readonly measurementRepository:
            PerformanceMeasurementRepository,
        private readonly adaptationTransaction:
            WorkoutProgrammePerformanceAdaptationTransaction,
    ) {}

    async execute(
        command: AdaptWorkoutProgrammeFromPerformanceCommand,
    ): Promise<Result<WorkoutProgrammeDto>> {

        const validationError = this.validate(command);

        if (validationError) {
            return Result.failure(validationError);
        }

        try {
            const programme =
                await this.workoutProgrammeRepository.findById(
                    command.programmeId,
                    command.tenantId,
                );

            if (!programme) {
                return Result.failure("Workout Programme not found.");
            }

            if (programme.athleteId !== command.athleteId) {
                return Result.failure(
                    "Workout Programme does not belong to athlete.",
                );
            }

            const athlete = await this.athleteRepository.findById(
                command.athleteId,
                command.tenantId,
            );

            if (!athlete) {
                return Result.failure("Athlete not found.");
            }

            const metric = await this.metricRepository.findById(
                command.metricId,
                command.tenantId,
            );

            if (!metric) {
                return Result.failure("Performance metric not found.");
            }

            if (metric.athleteId !== command.athleteId) {
                return Result.failure(
                    "Performance metric does not belong to athlete.",
                );
            }

            const measurements =
                await this.measurementRepository.listRecentEffectiveForMetric(
                    command.tenantId,
                    command.athleteId,
                    command.metricId,
                    1,
                );

            const measurement = measurements[0];

            if (!measurement) {
                return Result.failure(
                    "Recent performance measurement evidence is required.",
                );
            }

            if (
                measurement.tenantId !== command.tenantId ||
                measurement.athleteId !== command.athleteId ||
                measurement.metricId !== command.metricId
            ) {
                return Result.failure(
                    "Performance measurement evidence is invalid.",
                );
            }

            const updated =
                await this.adaptationTransaction.execute({
                    programmeId: command.programmeId,
                    tenantId: command.tenantId,
                    actorUserId: command.actorUserId,
                    athleteId: command.athleteId,
                    metricId: command.metricId,
                    measurementId: measurement.id,
                    trainingFrequencyDelta:
                        command.trainingFrequencyDelta,
                    sessionDurationMinutesDelta:
                        command.sessionDurationMinutesDelta,
                    rationale: command.rationale.trim(),
                });

            return Result.success(
                WorkoutProgrammeApplicationMapper.toDto(updated),
            );
        } catch (error) {
            if (
                error instanceof Error &&
                this.isDomainValidationError(error.message)
            ) {
                return Result.failure(error.message);
            }

            return Result.failure(
                "Unable to adapt Workout Programme from performance evidence.",
            );
        }
    }

    private validate(
        command: AdaptWorkoutProgrammeFromPerformanceCommand,
    ): string | null {
        const requiredIdentifiers = [
            command.programmeId,
            command.tenantId,
            command.actorUserId,
            command.athleteId,
            command.metricId,
        ];

        if (
            requiredIdentifiers.some(
                value => typeof value !== "string" || !value.trim(),
            )
        ) {
            return "Programme, tenant, actor, athlete and metric IDs are required.";
        }

        if (
            typeof command.rationale !== "string" ||
            !command.rationale.trim()
        ) {
            return "Adaptation rationale is required.";
        }

        if (command.rationale.trim().length > 1000) {
            return "Adaptation rationale must not exceed 1000 characters.";
        }

        if (
            !Number.isInteger(command.trainingFrequencyDelta) ||
            command.trainingFrequencyDelta < -1 ||
            command.trainingFrequencyDelta > 1
        ) {
            return "Training frequency delta must be -1, 0 or 1.";
        }

        if (
            !Number.isInteger(command.sessionDurationMinutesDelta) ||
            command.sessionDurationMinutesDelta < -15 ||
            command.sessionDurationMinutesDelta > 15
        ) {
            return "Session duration delta must be an integer between -15 and 15.";
        }

        if (
            command.trainingFrequencyDelta === 0 &&
            command.sessionDurationMinutesDelta === 0
        ) {
            return "At least one adaptation delta must be non-zero.";
        }

        return null;
    }

    private isDomainValidationError(message: string): boolean {
        return [
            "Training frequency delta must be -1, 0 or 1.",
            "Session duration delta must be an integer between -15 and 15.",
            "Training frequency must be a positive integer.",
            "Session duration must be a positive integer.",
            "Deleted workout programmes cannot be modified.",
        ].includes(message);
    }
}

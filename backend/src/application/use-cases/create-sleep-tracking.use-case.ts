import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { SleepTrackingRepository } from "../../domain/repositories/sleep-tracking.repository";
import { SleepTracking } from "../../domain/entities/sleep-tracking.entity";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export interface CreateSleepTrackingCommand {
    tenantId: string;
    athleteId: string;
    value: number;
    recordedAt?: Date;
    sourceType: string;
    sourceId: string;
    sourceObservationId: string;
}

export interface CreateSleepTrackingResult {
    tracking: SleepTracking;
    replayed: boolean;
}

export class CreateSleepTrackingUseCase
implements UseCase<
    CreateSleepTrackingCommand,
    Result<CreateSleepTrackingResult>
> {
    constructor(
        private readonly trackingRepository:
            SleepTrackingRepository,
        private readonly athleteRepository:
            AthleteRepository,
    ) {}

    async execute(
        command: CreateSleepTrackingCommand,
    ): Promise<Result<CreateSleepTrackingResult>> {

        const athlete =
            await this.athleteRepository.findById(
                command.athleteId,
                command.tenantId,
            );

        if (!athlete) {
            return Result.failure("Athlete not found.");
        }

        try {
            const tracking =
                SleepTracking.create(
                    command.tenantId,
                    command.athleteId,
                    command.value,
                    command.recordedAt,
                    command.sourceType,
                    command.sourceId,
                    command.sourceObservationId,
                );

            const outcome =
                await this.trackingRepository.createIdempotently(
                    tracking,
                );

            if (outcome.kind === "idempotency-conflict") {
                return Result.failure(
                    "Sleep observation identity already exists with different data.",
                );
            }

            return Result.success({
                tracking: outcome.tracking,
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

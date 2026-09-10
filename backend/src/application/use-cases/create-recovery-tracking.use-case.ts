import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { RecoveryTrackingRepository } from "../../domain/repositories/recovery-tracking/recovery-tracking.repository";
import { RecoveryTracking } from "../../domain/entities/recovery-tracking/recovery-tracking.entity";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export interface CreateRecoveryTrackingCommand {
    tenantId: string;
    athleteId: string;
    value: number;
    recordedAt?: Date;
    sourceType: string;
    sourceId: string;
    sourceObservationId: string;
}

export interface CreateRecoveryTrackingResult {
    tracking: RecoveryTracking;
    replayed: boolean;
}

export class CreateRecoveryTrackingUseCase
implements UseCase<
    CreateRecoveryTrackingCommand,
    Result<CreateRecoveryTrackingResult>
> {

    constructor(
        private readonly trackingRepository:
            RecoveryTrackingRepository,

        private readonly athleteRepository:
            AthleteRepository,
    ) {}

    async execute(
        command: CreateRecoveryTrackingCommand,
    ): Promise<Result<CreateRecoveryTrackingResult>> {

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
                RecoveryTracking.create(
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
                    "Recovery observation identity already exists with different data.",
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

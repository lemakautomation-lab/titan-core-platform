import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { RestTracking } from "../../domain/entities/rest-tracking.entity";
import { RestTrackingRepository } from "../../domain/repositories/rest-tracking.repository";

export interface CreateRestTrackingCommand {
    tenantId: string;
    athleteId: string;
    value: number;
    recordedAt?: Date;
    sourceType?: string;
    sourceId?: string;
    sourceObservationId?: string;
}

export interface CreateRestTrackingResult {
    tracking: RestTracking;
    replayed: boolean;
}

export class CreateRestTrackingUseCase {
    constructor(
        private readonly repository: RestTrackingRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        command: CreateRestTrackingCommand,
    ): Promise<{
        isSuccess: boolean;
        value?: CreateRestTrackingResult;
        error?: string;
    }> {
        try {
            const athlete =
                await this.athleteRepository.findById(
                    command.athleteId,
                    command.tenantId,
                );

            if (!athlete) {
                return {
                    isSuccess: false,
                    error: "Athlete not found.",
                };
            }

            const tracking =
                RestTracking.create(
                    command.tenantId,
                    command.athleteId,
                    command.value,
                    command.recordedAt,
                    command.sourceType,
                    command.sourceId,
                    command.sourceObservationId,
                );

            const result =
                await this.repository.createIdempotently(
                    tracking,
                );

            if (result.kind === "idempotency-conflict") {
                return {
                    isSuccess: false,
                    error:
                        "Rest observation identity already exists with different data.",
                };
            }

            return {
                isSuccess: true,
                value: {
                    tracking: result.tracking,
                    replayed:
                        result.kind === "replayed",
                },
            };
        } catch (error) {
            return {
                isSuccess: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to create rest tracking.",
            };
        }
    }
}
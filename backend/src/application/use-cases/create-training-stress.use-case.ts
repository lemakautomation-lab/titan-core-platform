import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { TrainingStress } from "../../domain/entities/training-stress.entity";
import { TrainingStressRepository } from "../../domain/repositories/training-stress.repository";

export interface CreateTrainingStressCommand {
    tenantId: string;
    athleteId: string;
    value: number;
    recordedAt?: Date;
    sourceType?: string;
    sourceId?: string;
    sourceObservationId?: string;
}

export interface CreateTrainingStressResult {
    tracking: TrainingStress;
    replayed: boolean;
}

export class CreateTrainingStressUseCase {
    constructor(
        private readonly repository: TrainingStressRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        command: CreateTrainingStressCommand,
    ): Promise<{
        isSuccess: boolean;
        value?: CreateTrainingStressResult;
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
                TrainingStress.create(
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
                        "Training stress observation identity already exists with different data.",
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
                        : "Unable to create training stress.",
            };
        }
    }
}

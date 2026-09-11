import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { TrainingStress } from "../../domain/entities/training-stress.entity";
import { TrainingStressRepository } from "../../domain/repositories/training-stress.repository";

export interface ListRecentTrainingStressQuery {
    tenantId: string;
    athleteId: string;
    limit: number;
}

export class ListRecentTrainingStressUseCase {
    constructor(
        private readonly repository: TrainingStressRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        query: ListRecentTrainingStressQuery,
    ): Promise<{
        isSuccess: boolean;
        value?: TrainingStress[];
        error?: string;
    }> {
        try {
            const athlete =
                await this.athleteRepository.findById(
                    query.athleteId,
                    query.tenantId,
                );

            if (!athlete) {
                return {
                    isSuccess: false,
                    error: "Athlete not found.",
                };
            }

            if (!Number.isInteger(query.limit) || query.limit <= 0) {
                return {
                    isSuccess: false,
                    error: "Training stress limit must be positive.",
                };
            }

            if (query.limit > 100) {
                return {
                    isSuccess: false,
                    error:
                        "Training stress limit must be an integer between 1 and 100.",
                };
            }

            const trackings =
                await this.repository.listRecentForAthlete(
                    query.tenantId,
                    query.athleteId,
                    query.limit,
                );

            return {
                isSuccess: true,
                value: trackings,
            };
        } catch (error) {
            return {
                isSuccess: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to list recent training stress.",
            };
        }
    }
}

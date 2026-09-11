import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { RestTracking } from "../../domain/entities/rest-tracking.entity";
import { RestTrackingRepository } from "../../domain/repositories/rest-tracking.repository";

export interface ListRecentRestTrackingQuery {
    tenantId: string;
    athleteId: string;
    limit: number;
}

export class ListRecentRestTrackingUseCase {
    constructor(
        private readonly repository: RestTrackingRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        query: ListRecentRestTrackingQuery,
    ): Promise<{
        isSuccess: boolean;
        value?: RestTracking[];
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
                    error: "Rest tracking limit must be positive.",
                };
            }

            if (query.limit > 100) {
                return {
                    isSuccess: false,
                    error:
                        "Rest tracking limit must be an integer between 1 and 100.",
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
                        : "Unable to list recent rest tracking.",
            };
        }
    }
}
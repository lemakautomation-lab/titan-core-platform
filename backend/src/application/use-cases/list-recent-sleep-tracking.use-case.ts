import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { SleepTrackingRepository } from "../../domain/repositories/sleep-tracking.repository";
import { SleepTracking } from "../../domain/entities/sleep-tracking.entity";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export interface ListRecentSleepTrackingQuery {
    tenantId: string;
    athleteId: string;
    limit: number;
}

export class ListRecentSleepTrackingUseCase
implements UseCase<
    ListRecentSleepTrackingQuery,
    Result<SleepTracking[]>
> {
    constructor(
        private readonly trackingRepository:
            SleepTrackingRepository,
        private readonly athleteRepository:
            AthleteRepository,
    ) {}

    async execute(
        query: ListRecentSleepTrackingQuery,
    ): Promise<Result<SleepTracking[]>> {

        if (!Number.isInteger(query.limit) || query.limit <= 0) {
            return Result.failure(
                "Sleep tracking limit must be positive.",
            );
        }

        if (query.limit > 100) {
            return Result.failure(
                "Sleep tracking limit must be an integer between 1 and 100.",
            );
        }

        const athlete =
            await this.athleteRepository.findById(
                query.athleteId,
                query.tenantId,
            );

        if (!athlete) {
            return Result.failure("Athlete not found.");
        }

        const tracking =
            await this.trackingRepository.listRecentForAthlete(
                query.tenantId,
                query.athleteId,
                query.limit,
            );

        return Result.success(tracking);
    }
}

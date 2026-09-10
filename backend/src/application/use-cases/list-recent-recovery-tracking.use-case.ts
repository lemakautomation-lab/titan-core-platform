import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { RecoveryTrackingRepository } from "../../domain/repositories/recovery-tracking/recovery-tracking.repository";
import { RecoveryTracking } from "../../domain/entities/recovery-tracking/recovery-tracking.entity";

import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export interface ListRecentRecoveryTrackingQuery {
    tenantId: string;
    athleteId: string;
    limit: number;
}

export class ListRecentRecoveryTrackingUseCase
implements UseCase<
    ListRecentRecoveryTrackingQuery,
    Result<RecoveryTracking[]>
> {

    constructor(
        private readonly trackingRepository:
            RecoveryTrackingRepository,

        private readonly athleteRepository:
            AthleteRepository,
    ) {}

    async execute(
        query: ListRecentRecoveryTrackingQuery,
    ): Promise<Result<RecoveryTracking[]>> {

        if (!Number.isInteger(query.limit) || query.limit <= 0) {
            return Result.failure(
                "Recovery tracking limit must be positive.",
            );
        }

        if (query.limit > 100) {
            return Result.failure(
                "Recovery tracking limit must be an integer between 1 and 100.",
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

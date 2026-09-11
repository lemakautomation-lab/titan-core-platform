import { SleepTracking } from "../entities/sleep-tracking.entity";

export interface SleepTrackingRepository {
    createIdempotently(
        tracking: SleepTracking,
    ): Promise<
        | { kind: "created"; tracking: SleepTracking }
        | { kind: "replayed"; tracking: SleepTracking }
        | { kind: "idempotency-conflict" }
    >;

    listRecentForAthlete(
        tenantId: string,
        athleteId: string,
        limit: number,
    ): Promise<SleepTracking[]>;
}

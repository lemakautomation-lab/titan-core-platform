import { RestTracking } from "../entities/rest-tracking.entity";

export interface RestTrackingRepository {
    createIdempotently(
        tracking: RestTracking,
    ): Promise<
        | { kind: "created"; tracking: RestTracking }
        | { kind: "replayed"; tracking: RestTracking }
        | { kind: "idempotency-conflict" }
    >;

    listRecentForAthlete(
        tenantId: string,
        athleteId: string,
        limit: number,
    ): Promise<RestTracking[]>;
}
import { RecoveryTracking } from "../../entities/recovery-tracking/recovery-tracking.entity";

export interface RecoveryTrackingRepository {

    createIdempotently(
        tracking: RecoveryTracking,
    ): Promise<
        | { kind: "created"; tracking: RecoveryTracking }
        | { kind: "replayed"; tracking: RecoveryTracking }
        | { kind: "idempotency-conflict" }
    >;

    listRecentForAthlete(
        tenantId: string,
        athleteId: string,
        limit: number,
    ): Promise<RecoveryTracking[]>;
}

export type RecoveryTrackingCreateOutcome = Awaited<
    ReturnType<RecoveryTrackingRepository["createIdempotently"]>
>;

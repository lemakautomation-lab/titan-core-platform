import { RecoveryTracking } from "../../../domain/entities/recovery-tracking/recovery-tracking.entity";
import { RecoveryTrackingRepository } from "../../../domain/repositories/recovery-tracking/recovery-tracking.repository";
import { DatabaseService } from "../../database/database.service";

type RecoveryTrackingRow = {
    id: string;
    tenantId: string;
    athleteId: string;
    value: unknown;
    recordedAt: Date;
    createdAt: Date;
    sourceType: string;
    sourceId: string;
    sourceObservationId: string;
};

export class PrismaRecoveryTrackingRepository
implements RecoveryTrackingRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async createIdempotently(
        tracking: RecoveryTracking,
    ) {
        const inserted =
            await this.database.prisma.$queryRaw<RecoveryTrackingRow[]>`
                INSERT INTO "RecoveryTracking" (
                    "id",
                    "tenantId",
                    "athleteId",
                    "value",
                    "recordedAt",
                    "createdAt",
                    "sourceType",
                    "sourceId",
                    "sourceObservationId"
                )
                VALUES (
                    ${tracking.id},
                    ${tracking.tenantId},
                    ${tracking.athleteId},
                    ${tracking.value},
                    ${tracking.recordedAt},
                    ${tracking.createdAt},
                    ${tracking.sourceType},
                    ${tracking.sourceId},
                    ${tracking.sourceObservationId}
                )
                ON CONFLICT DO NOTHING
                RETURNING *
            `;

        if (inserted[0]) {
            return {
                kind: "created" as const,
                tracking: this.toDomain(inserted[0]),
            };
        }

        const existing =
            await this.database.prisma.$queryRaw<RecoveryTrackingRow[]>`
                SELECT *
                FROM "RecoveryTracking"
                WHERE "tenantId" = ${tracking.tenantId}
                  AND "sourceType" = ${tracking.sourceType}
                  AND "sourceId" = ${tracking.sourceId}
                  AND "sourceObservationId" = ${tracking.sourceObservationId}
                LIMIT 1
            `;

        if (!existing[0]) {
            return {
                kind: "idempotency-conflict" as const,
            };
        }

        const persisted = this.toDomain(existing[0]);

        if (!this.samePayload(persisted, tracking)) {
            return {
                kind: "idempotency-conflict" as const,
            };
        }

        return {
            kind: "replayed" as const,
            tracking: persisted,
        };
    }

    async listRecentForAthlete(
        tenantId: string,
        athleteId: string,
        limit: number,
    ): Promise<RecoveryTracking[]> {
        this.validateLimit(limit);

        const rows =
            await this.database.prisma.$queryRaw<RecoveryTrackingRow[]>`
                SELECT *
                FROM "RecoveryTracking"
                WHERE "tenantId" = ${tenantId}
                  AND "athleteId" = ${athleteId}
                ORDER BY "recordedAt" DESC, "id" DESC
                LIMIT ${limit}
            `;

        return rows.map(row => this.toDomain(row));
    }

    private validateLimit(limit: number): void {
        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error("Recovery tracking limit must be positive.");
        }
    }

    private toDomain(row: RecoveryTrackingRow): RecoveryTracking {
        return new RecoveryTracking(
            row.id,
            row.tenantId,
            row.athleteId,
            Number(row.value),
            row.recordedAt,
            row.createdAt,
            row.sourceType,
            row.sourceId,
            row.sourceObservationId,
        );
    }

    private samePayload(
        left: RecoveryTracking,
        right: RecoveryTracking,
    ): boolean {
        return left.tenantId === right.tenantId &&
            left.athleteId === right.athleteId &&
            left.value === Number(right.value.toFixed(6)) &&
            left.recordedAt.getTime() === right.recordedAt.getTime() &&
            left.sourceType === right.sourceType &&
            left.sourceId === right.sourceId &&
            left.sourceObservationId === right.sourceObservationId;
    }
}

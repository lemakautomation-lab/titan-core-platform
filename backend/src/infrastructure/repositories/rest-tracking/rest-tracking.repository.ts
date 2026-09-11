import { RestTracking } from "../../../domain/entities/rest-tracking.entity";
import { RestTrackingRepository } from "../../../domain/repositories/rest-tracking.repository";
import { DatabaseService } from "../../database/database.service";

interface RestTrackingRow {
    id: string;
    tenantId: string;
    athleteId: string;
    value: unknown;
    recordedAt: Date;
    createdAt: Date;
    sourceType: string;
    sourceId: string;
    sourceObservationId: string;
}

export class PrismaRestTrackingRepository
    implements RestTrackingRepository
{
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async createIdempotently(
        tracking: RestTracking,
    ): Promise<
        | { kind: "created"; tracking: RestTracking }
        | { kind: "replayed"; tracking: RestTracking }
        | { kind: "idempotency-conflict" }
    > {
        const existing =
            await this.database.prisma.restTracking.findFirst({
                where: {
                    tenantId: tracking.tenantId,
                    sourceType: tracking.sourceType,
                    sourceId: tracking.sourceId,
                    sourceObservationId:
                        tracking.sourceObservationId,
                },
            });

        if (existing) {
            const persisted =
                this.toDomain(existing);

            if (this.samePayload(persisted, tracking)) {
                return {
                    kind: "replayed",
                    tracking: persisted,
                };
            }

            return {
                kind: "idempotency-conflict",
            };
        }

        try {
            const created =
                await this.database.prisma.restTracking.create({
                    data: {
                        id: tracking.id,
                        tenantId: tracking.tenantId,
                        athleteId: tracking.athleteId,
                        value: tracking.value,
                        recordedAt: tracking.recordedAt,
                        createdAt: tracking.createdAt,
                        sourceType: tracking.sourceType,
                        sourceId: tracking.sourceId,
                        sourceObservationId:
                            tracking.sourceObservationId,
                    },
                });

            return {
                kind: "created",
                tracking: this.toDomain(created),
            };
        } catch (error) {
            const persisted =
                await this.database.prisma.restTracking.findFirst({
                    where: {
                        tenantId: tracking.tenantId,
                        sourceType: tracking.sourceType,
                        sourceId: tracking.sourceId,
                        sourceObservationId:
                            tracking.sourceObservationId,
                    },
                });

            if (persisted) {
                const domain =
                    this.toDomain(persisted);

                if (this.samePayload(domain, tracking)) {
                    return {
                        kind: "replayed",
                        tracking: domain,
                    };
                }

                return {
                    kind: "idempotency-conflict",
                };
            }

            throw error;
        }
    }

    async listRecentForAthlete(
        tenantId: string,
        athleteId: string,
        limit: number,
    ): Promise<RestTracking[]> {
        this.validateLimit(limit);

        const rows =
            await this.database.prisma.$queryRaw<RestTrackingRow[]>`
                SELECT *
                FROM "RestTracking"
                WHERE "tenantId" = ${tenantId}
                  AND "athleteId" = ${athleteId}
                ORDER BY "recordedAt" DESC, "id" DESC
                LIMIT ${limit}
            `;

        return rows.map(row => this.toDomain(row));
    }

    private validateLimit(limit: number): void {
        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error(
                "Rest tracking limit must be positive.",
            );
        }
    }

    private toDomain(
        row: RestTrackingRow,
    ): RestTracking {
        return new RestTracking(
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
        left: RestTracking,
        right: RestTracking,
    ): boolean {
        return left.tenantId === right.tenantId &&
            left.athleteId === right.athleteId &&
            left.value === Number(
                right.value.toFixed(6),
            ) &&
            left.recordedAt.getTime() ===
                right.recordedAt.getTime() &&
            left.sourceType === right.sourceType &&
            left.sourceId === right.sourceId &&
            left.sourceObservationId ===
                right.sourceObservationId;
    }
}
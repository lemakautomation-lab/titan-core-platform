import { TrainingStress } from "../../../domain/entities/training-stress.entity";
import { TrainingStressRepository } from "../../../domain/repositories/training-stress.repository";
import { DatabaseService } from "../../database/database.service";

interface TrainingStressRow {
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

export class PrismaTrainingStressRepository
    implements TrainingStressRepository
{
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async createIdempotently(
        tracking: TrainingStress,
    ): Promise<
        | { kind: "created"; tracking: TrainingStress }
        | { kind: "replayed"; tracking: TrainingStress }
        | { kind: "idempotency-conflict" }
    > {
        const existing =
            await this.database.prisma.trainingStress.findFirst({
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
                await this.database.prisma.trainingStress.create({
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
                await this.database.prisma.trainingStress.findFirst({
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
    ): Promise<TrainingStress[]> {
        this.validateLimit(limit);

        const rows =
            await this.database.prisma.$queryRaw<TrainingStressRow[]>`
                SELECT *
                FROM "TrainingStress"
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
        row: TrainingStressRow,
    ): TrainingStress {
        return new TrainingStress(
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
        left: TrainingStress,
        right: TrainingStress,
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

import { PerformanceMeasurement } from "../../../domain/entities/performance-measurement/performance-measurement.entity";
import { PerformanceMeasurementRepository } from "../../../domain/repositories/performance-measurement/performance-measurement.repository";
import { DatabaseService } from "../../database/database.service";

type MeasurementRow = {
    id: string; tenantId: string; athleteId: string; metricId: string;
    value: unknown; recordedAt: Date; createdAt: Date;
    sourceType: string | null; sourceId: string | null;
    sourceObservationId: string | null;
    correctsMeasurementId: string | null;
};

export class PrismaPerformanceMeasurementRepository
implements PerformanceMeasurementRepository {
    constructor(private readonly database: DatabaseService) {}

    async createIdempotently(measurement: PerformanceMeasurement) {
        return this.createIdempotentlyWith(
            this.database.prisma,
            measurement,
        );
    }

    async createIdempotentlyWith(
        prisma: Pick<DatabaseService["prisma"], "$queryRaw">,
        measurement: PerformanceMeasurement,
    ) {
        const inserted = await prisma.$queryRaw<MeasurementRow[]>`
            INSERT INTO "PerformanceMeasurement" (
                "id", "tenantId", "athleteId", "metricId", "value",
                "recordedAt", "createdAt", "sourceType", "sourceId",
                "sourceObservationId", "correctsMeasurementId"
            ) VALUES (
                ${measurement.id}, ${measurement.tenantId}, ${measurement.athleteId},
                ${measurement.metricId}, ${measurement.value}, ${measurement.recordedAt},
                ${measurement.createdAt}, ${measurement.sourceType}, ${measurement.sourceId},
                ${measurement.sourceObservationId}, ${measurement.correctsMeasurementId}
            ) ON CONFLICT DO NOTHING RETURNING *
        `;
        if (inserted[0]) {
            return { kind: "created" as const, measurement: this.toDomain(inserted[0]) };
        }

        const existing = await prisma.$queryRaw<MeasurementRow[]>`
            SELECT * FROM "PerformanceMeasurement"
            WHERE "tenantId" = ${measurement.tenantId}
              AND "sourceType" = ${measurement.sourceType}
              AND "sourceId" = ${measurement.sourceId}
              AND "sourceObservationId" = ${measurement.sourceObservationId}
            LIMIT 1
        `;
        if (!existing[0]) return { kind: "correction-conflict" as const };
        const persisted = this.toDomain(existing[0]);
        if (!this.samePayload(persisted, measurement)) {
            return { kind: "idempotency-conflict" as const };
        }
        return { kind: "replayed" as const, measurement: persisted };
    }

    async findCorrectionTarget(id: string, tenantId: string, athleteId: string, metricId: string) {
        const rows = await this.database.prisma.$queryRaw<MeasurementRow[]>`
            SELECT * FROM "PerformanceMeasurement"
            WHERE "id" = ${id} AND "tenantId" = ${tenantId}
              AND "athleteId" = ${athleteId} AND "metricId" = ${metricId}
            LIMIT 1
        `;
        return rows[0] ? this.toDomain(rows[0]) : null;
    }

    async listRecentForMetric(tenantId: string, athleteId: string, metricId: string, limit: number) {
        this.validateLimit(limit);
        const rows = await this.database.prisma.$queryRaw<MeasurementRow[]>`
            SELECT * FROM "PerformanceMeasurement"
            WHERE "tenantId" = ${tenantId} AND "athleteId" = ${athleteId}
              AND "metricId" = ${metricId}
            ORDER BY "recordedAt" DESC, "id" DESC LIMIT ${limit}
        `;
        return rows.map(row => this.toDomain(row));
    }

    async listRecentEffectiveForMetric(tenantId: string, athleteId: string, metricId: string, limit: number) {
        this.validateLimit(limit);
        const rows = await this.database.prisma.$queryRaw<MeasurementRow[]>`
            SELECT measurement.* FROM "PerformanceMeasurement" measurement
            WHERE measurement."tenantId" = ${tenantId}
              AND measurement."athleteId" = ${athleteId}
              AND measurement."metricId" = ${metricId}
              AND NOT EXISTS (
                  SELECT 1 FROM "PerformanceMeasurement" correction
                  WHERE correction."correctsMeasurementId" = measurement."id"
              )
            ORDER BY measurement."recordedAt" DESC, measurement."id" DESC LIMIT ${limit}
        `;
        return rows.map(row => this.toDomain(row));
    }

    private validateLimit(limit: number) {
        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error("Performance measurement limit must be positive.");
        }
    }

    private toDomain(row: MeasurementRow) {
        return new PerformanceMeasurement(
            row.id, row.tenantId, row.athleteId, row.metricId,
            Number(row.value), row.recordedAt, row.createdAt,
            row.sourceType, row.sourceId, row.sourceObservationId,
            row.correctsMeasurementId,
        );
    }

    private samePayload(left: PerformanceMeasurement, right: PerformanceMeasurement) {
        return left.tenantId === right.tenantId &&
            left.athleteId === right.athleteId && left.metricId === right.metricId &&
            left.value === Number(right.value.toFixed(6)) &&
            left.recordedAt.getTime() === right.recordedAt.getTime() &&
            left.correctsMeasurementId === right.correctsMeasurementId;
    }
}

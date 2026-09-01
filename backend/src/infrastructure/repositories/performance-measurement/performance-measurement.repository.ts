import { PerformanceMeasurement } from "../../../domain/entities/performance-measurement/performance-measurement.entity";
import { PerformanceMeasurementRepository } from "../../../domain/repositories/performance-measurement/performance-measurement.repository";
import { DatabaseService } from "../../database/database.service";

export class PrismaPerformanceMeasurementRepository
implements PerformanceMeasurementRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async create(
        measurement: PerformanceMeasurement,
    ): Promise<PerformanceMeasurement> {

        const created =
            await this.database.prisma.performanceMeasurement.create({
                data: {
                    id: measurement.id,
                    tenantId: measurement.tenantId,
                    athleteId: measurement.athleteId,
                    metricId: measurement.metricId,
                    value: measurement.value,
                    recordedAt: measurement.recordedAt,
                    createdAt: measurement.createdAt,
                },
            });

        return new PerformanceMeasurement(
            created.id,
            created.tenantId,
            created.athleteId,
            created.metricId,
            Number(created.value),
            created.recordedAt,
            created.createdAt,
        );
    }

    async listRecentForMetric(
        tenantId: string,
        athleteId: string,
        metricId: string,
        limit: number,
    ): Promise<PerformanceMeasurement[]> {

        if (
            !Number.isInteger(limit) ||
            limit <= 0
        ) {
            throw new Error(
                "Performance measurement limit must be positive.",
            );
        }

        const rows =
            await this.database.prisma.performanceMeasurement.findMany({
                where: {
                    tenantId,
                    athleteId,
                    metricId,
                },
                orderBy: [
                    {
                        recordedAt: "desc",
                    },
                    {
                        id: "desc",
                    },
                ],
                take: limit,
            });

        return rows.map(
            (row) =>
                new PerformanceMeasurement(
                    row.id,
                    row.tenantId,
                    row.athleteId,
                    row.metricId,
                    Number(row.value),
                    row.recordedAt,
                    row.createdAt,
                ),
        );
    }
}

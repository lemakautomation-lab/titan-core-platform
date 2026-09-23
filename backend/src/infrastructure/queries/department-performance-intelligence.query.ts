import { DepartmentPerformanceIntelligenceReader } from "../../application/use-cases/get-department-performance-intelligence.use-case";
import { DatabaseService } from "../database/database.service";

export class PrismaDepartmentPerformanceIntelligenceReader implements DepartmentPerformanceIntelligenceReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, userId: string, days: 7 | 30 | 90) {
        const actor = await this.database.prisma.user.findFirst({
            where: { id: userId, tenantId, status: "ACTIVE" },
            select: { organisationId: true },
        });
        if (!actor?.organisationId) return null;
        const organisation = await this.database.prisma.organisation.findFirst({
            where: { id: actor.organisationId, tenantId, status: "ACTIVE" },
            select: { id: true },
        });
        if (!organisation) return null;

        const now = new Date();
        const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const athleteScope = {
            tenantId, organisationId: organisation.id, status: "ACTIVE" as const,
        };
        const observationScope = {
            tenantId,
            athlete: athleteScope,
            recordedAt: { gte: since, lte: now },
            correctedBy: { none: {} },
        };

        const [activeAthleteCount, measuredAthleteCount, effectiveMeasurementCount, latest] =
            await Promise.all([
                this.database.prisma.athlete.count({ where: athleteScope }),
                this.database.prisma.athlete.count({ where: {
                    ...athleteScope,
                    performanceMeasurements: { some: {
                        recordedAt: { gte: since, lte: now },
                        correctedBy: { none: {} },
                    } },
                } }),
                this.database.prisma.performanceMeasurement.count({ where: observationScope }),
                this.database.prisma.performanceMeasurement.findFirst({
                    where: observationScope,
                    orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
                    select: { recordedAt: true },
                }),
            ]);

        return {
            organisationId: organisation.id,
            days,
            activeAthleteCount,
            measuredAthleteCount,
            effectiveMeasurementCount,
            latestMeasurementAt: latest?.recordedAt.toISOString() ?? null,
        };
    }
}

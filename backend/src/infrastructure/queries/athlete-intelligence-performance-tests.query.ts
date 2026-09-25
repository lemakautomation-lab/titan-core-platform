import { AthletePerformanceTestsReader } from "../../application/intelligence/athlete-performance-tests";
import { DatabaseService } from "../database/database.service";

/** Only effective results; the original remains auditable in the correction chain. */
export class PrismaAthletePerformanceTestsReader implements AthletePerformanceTestsReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const rows = await this.database.prisma.athletePerformanceTestResult.findMany({
            where: { tenantId, athleteId, correctedBy: { none: {} } },
            orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
            take: 20,
            select: { id: true, protocolId: true, value: true, recordedAt: true,
                correctsResultId: true, protocol: { select: {
                    sportId: true, code: true, name: true, version: true, unit: true,
                } },
            },
        });
        return { athleteId, results: rows.map(({ protocol, value, ...row }) => ({
            ...row, sportId: protocol.sportId, protocolCode: protocol.code,
            protocolName: protocol.name, protocolVersion: protocol.version,
            unit: protocol.unit, value: value.toString(),
        })) };
    }
}

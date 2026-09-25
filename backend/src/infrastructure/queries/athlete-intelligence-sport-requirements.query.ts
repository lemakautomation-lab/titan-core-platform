import { AthleteSportRequirementsReader } from "../../application/intelligence/athlete-sport-requirements";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteSportRequirementsReader implements AthleteSportRequirementsReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const rows = await this.database.prisma.athleteSportRequirement.findMany({
            where: { tenantId, athleteId, status: "ACTIVE", sport: { status: "ACTIVE" } },
            orderBy: [{ sportId: "asc" }, { code: "asc" }],
            take: 20,
            select: { id: true, sportId: true, code: true, targetValue: true,
                unit: true, version: true, sport: { select: { name: true } },
            },
        });
        return { athleteId, requirements: rows.map(({ sport, targetValue, ...row }) => ({
            ...row, sportName: sport.name, targetValue: targetValue.toString(),
        })) };
    }
}

import { AthleteRecoveryReader } from "../../application/intelligence/athlete-recovery";
import { DatabaseService } from "../database/database.service";

/** Raw recorded values retain decimal precision; no inferred units or recovery score. */
export class PrismaAthleteRecoveryReader implements AthleteRecoveryReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const rows = await this.database.prisma.recoveryTracking.findMany({
            where: { tenantId, athleteId },
            orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
            take: 20,
            select: { id: true, value: true, recordedAt: true },
        });
        return { athleteId, observations: rows.map(({ id, value, recordedAt }) => ({
            id, value: value.toString(), recordedAt,
        })) };
    }
}

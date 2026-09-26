import {
    WearableMetric, WearableProvider, WearableReader,
} from "../../application/intelligence/athlete-wearables";
import { DatabaseService } from "../database/database.service";

/** Only observations from a currently consented, active Athlete connection. */
export class PrismaAthleteWearableReader implements WearableReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, athleteId: string) {
        const rows = await this.database.prisma.wearableObservation.findMany({
            where: { tenantId, athleteId, connection: { revokedAt: null,
                athlete: { status: "ACTIVE" } } },
            orderBy: [{ observedAt: "desc" }, { id: "desc" }],
            take: 20,
            select: { id: true, metricCode: true, value: true, unit: true,
                observedAt: true, connection: { select: { provider: true } },
            },
        });
        return { athleteId, observations: rows.map(({ connection, value, metricCode, ...row }) => ({
            ...row, provider: connection.provider as WearableProvider,
            metricCode: metricCode as WearableMetric, value: value.toString(),
        })) };
    }
}

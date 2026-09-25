import { AthleteIntelligenceContextReader } from "../../application/intelligence/athlete-context";
import { DatabaseService } from "../database/database.service";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Do not expose an Athlete context on the basis of a club roster grant. */
export class PrismaAthleteIntelligenceContextReader implements AthleteIntelligenceContextReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, actorId: string, athleteId: string) {
        if (![tenantId, actorId, athleteId].every((id) => uuidPattern.test(id))) return null;

        const actor = await this.database.prisma.user.findFirst({
            where: { id: actorId, tenantId, status: "ACTIVE" },
            select: { id: true },
        });
        if (!actor) return null;

        const athlete = await this.database.prisma.athlete.findFirst({
            where: { id: athleteId, tenantId, status: "ACTIVE" },
            select: { id: true, userId: true, organisationId: true },
        });
        if (!athlete) return null;

        if (athlete.userId !== actorId) {
            const now = new Date();
            const relationship = await this.database.prisma.athleteRelationship.findFirst({
                where: {
                    tenantId, athleteId: athlete.id, relatedEntityId: actorId,
                    relationshipType: "PERFORMANCE_PROFESSIONAL", status: "ACTIVE",
                    AND: [
                        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
                    ],
                },
                select: { id: true },
            });
            if (!relationship) return null;
        }

        return { athleteId: athlete.id, organisationId: athlete.organisationId };
    }
}

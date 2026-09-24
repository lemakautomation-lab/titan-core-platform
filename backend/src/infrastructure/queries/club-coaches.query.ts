import { ClubCoachReader } from "../../application/use-cases/list-club-coaches.use-case";
import { DatabaseService } from "../database/database.service";

export class PrismaClubCoachReader implements ClubCoachReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, userId: string, limit: number, cursor: string | null) {
        const actor = await this.database.prisma.user.findFirst({
            where: { id: userId, tenantId, status: "ACTIVE" },
            select: { organisationId: true },
        });
        if (!actor?.organisationId) return null;
        const club = await this.database.prisma.organisation.findFirst({
            where: { id: actor.organisationId, tenantId, status: "ACTIVE" },
            select: { id: true },
        });
        if (!club) return null;

        const where = {
            tenantId,
            organisationId: club.id,
            status: "ACTIVE" as const,
            userRoles: { some: { role: { tenantId, name: "COACH" } } },
        };
        if (cursor) {
            const scopedCursor = await this.database.prisma.user.findFirst({
                where: { ...where, id: cursor }, select: { id: true },
            });
            if (!scopedCursor) return null;
        }
        const rows = await this.database.prisma.user.findMany({
            where,
            orderBy: { id: "asc" },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: { id: true, firstName: true, lastName: true },
        });
        const page = rows.slice(0, limit);
        return {
            organisationId: club.id,
            coaches: page.map((user) => ({
                id: user.id,
                name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Coach",
            })),
            nextCursor: rows.length > limit ? page[page.length - 1].id : null,
        };
    }
}

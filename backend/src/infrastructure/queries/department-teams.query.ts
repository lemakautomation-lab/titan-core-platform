import { DepartmentTeamsReader } from "../../application/use-cases/list-department-teams.use-case";
import { DatabaseService } from "../database/database.service";

export class PrismaDepartmentTeamsReader implements DepartmentTeamsReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, userId: string, limit: number, cursor: string | null) {
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

        const where = {
            tenantId,
            status: "ACTIVE" as const,
            coach: {
                tenantId,
                status: "ACTIVE" as const,
                organisationId: organisation.id,
            },
        };
        // Prisma cursors can reference records outside the filter. Validate within scope first.
        if (cursor) {
            const ownCursor = await this.database.prisma.coachTeam.findFirst({
                where: { ...where, id: cursor },
                select: { id: true },
            });
            if (!ownCursor) return null;
        }

        const rows = await this.database.prisma.coachTeam.findMany({
            where,
            orderBy: [{ name: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: { id: true, name: true },
        });
        const teams = rows.slice(0, limit);
        return {
            organisationId: organisation.id,
            teams,
            nextCursor: rows.length > limit ? teams[teams.length - 1].id : null,
        };
    }
}

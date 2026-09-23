import { DepartmentCommandCentreReader } from "../../application/use-cases/get-department-command-centre.use-case";
import { DatabaseService } from "../database/database.service";

export class PrismaDepartmentCommandCentreReader implements DepartmentCommandCentreReader {
    constructor(private readonly database: DatabaseService) {}

    async read(tenantId: string, userId: string) {
        const actor = await this.database.prisma.user.findFirst({
            where: { id: userId, tenantId, status: "ACTIVE" },
            select: { organisationId: true },
        });
        if (!actor?.organisationId) return null;

        const organisation = await this.database.prisma.organisation.findFirst({
            where: { id: actor.organisationId, tenantId, status: "ACTIVE" },
            select: { id: true, name: true },
        });
        if (!organisation) return null;

        const scope = { tenantId, organisationId: organisation.id, status: "ACTIVE" as const };
        const [staffCount, athleteCount] = await Promise.all([
            this.database.prisma.user.count({ where: scope }),
            this.database.prisma.athlete.count({ where: scope }),
        ]);
        return {
            organisationId: organisation.id,
            organisationName: organisation.name,
            staffCount,
            athleteCount,
        };
    }
}

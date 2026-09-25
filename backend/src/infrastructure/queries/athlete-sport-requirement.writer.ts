import { randomUUID } from "node:crypto";
import { AssignSportRequirementInput, SportRequirementWriter } from "../../application/intelligence/assign-athlete-sport-requirement";
import { DatabaseService } from "../database/database.service";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const valuePattern = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,6})?$/;

/** Transactional, audited assignment. The database enforces one active version. */
export class PrismaAthleteSportRequirementWriter implements SportRequirementWriter {
    constructor(private readonly database: DatabaseService) {}

    async assign(input: AssignSportRequirementInput) {
        if (![input.tenantId, input.actorId, input.athleteId, input.sportId].every((id) => uuid.test(id)) ||
            !/^[A-Z][A-Z0-9_]{1,63}$/.test(input.code) ||
            !valuePattern.test(input.targetValue) ||
            input.unit.trim() !== input.unit || input.unit.length < 1 || input.unit.length > 24) {
            throw new Error("Invalid sport requirement assignment.");
        }
        return this.database.transaction(async (tx) => {
            const sport = await tx.sport.findFirst({ where: {
                id: input.sportId, tenantId: input.tenantId, status: "ACTIVE",
            }, select: { id: true } });
            if (!sport) throw new Error("Sport not available in tenant.");
            const latest = await tx.athleteSportRequirement.findFirst({
                where: { tenantId: input.tenantId, athleteId: input.athleteId,
                    sportId: input.sportId, code: input.code },
                orderBy: { version: "desc" }, select: { version: true },
            });
            await tx.athleteSportRequirement.updateMany({
                where: { tenantId: input.tenantId, athleteId: input.athleteId,
                    sportId: input.sportId, code: input.code, status: "ACTIVE" },
                data: { status: "INACTIVE" },
            });
            const row = await tx.athleteSportRequirement.create({ data: {
                id: randomUUID(), tenantId: input.tenantId, athleteId: input.athleteId,
                sportId: input.sportId, code: input.code, targetValue: input.targetValue,
                unit: input.unit, version: (latest?.version ?? 0) + 1,
            }, select: { id: true, version: true } });
            await tx.auditLog.create({ data: {
                tenantId: input.tenantId, userId: input.actorId,
                action: "ATHLETE_SPORT_REQUIREMENT_ASSIGN", resource: "ATHLETE_SPORT_REQUIREMENT",
                resourceId: row.id, metadata: { athleteId: input.athleteId,
                    sportId: input.sportId, code: input.code, version: row.version,
                },
            } });
            return row;
        });
    }
}

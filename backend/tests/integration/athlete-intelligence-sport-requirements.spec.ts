import { describe, expect, it } from "vitest";
import { AssignAthleteSportRequirement } from "../../src/application/intelligence/assign-athlete-sport-requirement";
import { ReadAthleteIntelligenceSportRequirements } from "../../src/application/intelligence/athlete-sport-requirements";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthleteSportRequirementWriter } from "../../src/infrastructure/queries/athlete-sport-requirement.writer";
import { PrismaAthleteSportRequirementsReader } from "../../src/infrastructure/queries/athlete-intelligence-sport-requirements.query";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const context = new PrismaAthleteIntelligenceContextReader(database);
const permissions = authorizationModule.authorizationService;
const assign = new AssignAthleteSportRequirement(context, permissions,
    new PrismaAthleteSportRequirementWriter(database));
const read = new ReadAthleteIntelligenceSportRequirements(context, permissions,
    new PrismaAthleteSportRequirementsReader(database));

describe("Mission 071.8 explicit sport requirements", () => {
    it("enforces separate read/write grants and active Athlete scope", async () => {
        const owner = await createTestUser({ permissions: ["sport-requirements.write"] });
        const reader = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["sport-requirements.read"] });
        const foreign = await createTestUser({ permissions: ["sport-requirements.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Sport", lastName: "Scope",
        } });
        const sport = await testPrisma.sport.create({ data: {
            tenantId: owner.tenant.id, name: "Running", slug: "running",
        } });
        const input = { tenantId: owner.tenant.id, actorId: owner.user.id,
            athleteId: athlete.id, sportId: sport.id, code: "SPRINT_100M",
            targetValue: "12.345678", unit: "s",
        };
        expect(await read.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        expect(await read.execute(owner.tenant.id, reader.user.id, athlete.id)).toBeNull();
        expect(await read.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await assign.execute({ ...input, actorId: reader.user.id })).toBeNull();
        const first = await assign.execute(input);
        expect(first?.version).toBe(1);
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: reader.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        expect((await read.execute(owner.tenant.id, reader.user.id, athlete.id))?.requirements)
            .toEqual([{ id: first?.id, sportId: sport.id, sportName: "Running",
                code: "SPRINT_100M", targetValue: "12.345678", unit: "s", version: 1 }]);
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { status: "INACTIVE" },
        });
        expect(await read.execute(owner.tenant.id, reader.user.id, athlete.id)).toBeNull();
    });

    it("versions assignments atomically, audits changes and rejects invalid or foreign sport", async () => {
        const actor = await createTestUser({ permissions: ["sport-requirements.write", "sport-requirements.read"] });
        const foreign = await createTestUser();
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: actor.tenant.id, userId: actor.user.id, firstName: "Assigned", lastName: "Sport",
        } });
        const sport = await testPrisma.sport.create({ data: {
            tenantId: actor.tenant.id, name: "Cycling", slug: "cycling",
        } });
        const foreignSport = await testPrisma.sport.create({ data: {
            tenantId: foreign.tenant.id, name: "Foreign", slug: "foreign",
        } });
        const input = { tenantId: actor.tenant.id, actorId: actor.user.id,
            athleteId: athlete.id, sportId: sport.id, code: "VO2_TARGET",
            targetValue: "50.250000", unit: "ml/kg/min",
        };
        await expect(assign.execute({ ...input, code: "bad" })).rejects.toThrow();
        await expect(assign.execute({ ...input, sportId: foreignSport.id })).rejects.toThrow();
        const first = await assign.execute(input);
        const second = await assign.execute({ ...input, targetValue: "55.125000" });
        expect([first?.version, second?.version]).toEqual([1, 2]);
        const versions = await testPrisma.athleteSportRequirement.findMany({
            where: { tenantId: actor.tenant.id, athleteId: athlete.id }, orderBy: { version: "asc" },
        });
        expect(versions.map(({ status }) => status)).toEqual(["INACTIVE", "ACTIVE"]);
        expect((await read.execute(actor.tenant.id, actor.user.id, athlete.id))?.requirements)
            .toEqual([{ id: second?.id, sportId: sport.id, sportName: "Cycling",
                code: "VO2_TARGET", targetValue: "55.125", unit: "ml/kg/min", version: 2 }]);
        expect(await testPrisma.auditLog.count({ where: {
            tenantId: actor.tenant.id, action: "ATHLETE_SPORT_REQUIREMENT_ASSIGN",
        } })).toBe(2);
    });
});

import { describe, expect, it } from "vitest";
import { ReadAthleteIntelligenceGoals } from "../../src/application/intelligence/athlete-goals";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthleteGoalsReader } from "../../src/infrastructure/queries/athlete-intelligence-goals.query";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const goals = new ReadAthleteIntelligenceGoals(
    new PrismaAthleteIntelligenceContextReader(database),
    authorizationModule.authorizationService,
    new PrismaAthleteGoalsReader(database),
);

describe("Mission 071.7 scoped Athlete goal integration", () => {
    it("requires the independent read grant and active Athlete relationship in one tenant", async () => {
        const owner = await createTestUser();
        const professional = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["athlete-goals.read"] });
        const foreign = await createTestUser({ permissions: ["athlete-goals.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Goal", lastName: "Scope",
        } });
        expect(await goals.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        expect(await goals.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
        expect(await goals.execute(owner.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await goals.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        expect(await goals.execute(owner.tenant.id, professional.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, primaryGoal: null, secondaryGoals: [] });
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { status: "INACTIVE" },
        });
        expect(await goals.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
    });

    it("returns governed primary and secondary classifications only for the authorised Athlete", async () => {
        const owner = await createTestUser({ permissions: ["athlete-goals.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Own", lastName: "Goals",
        } });
        const other = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, firstName: "Other", lastName: "Goals",
        } });
        await testPrisma.athleteGoal.createMany({ data: [
            { tenantId: owner.tenant.id, athleteId: athlete.id,
                classification: "STRENGTH", isPrimary: true },
            { tenantId: owner.tenant.id, athleteId: athlete.id,
                classification: "MOBILITY", isPrimary: false },
            { tenantId: owner.tenant.id, athleteId: athlete.id,
                classification: "ENDURANCE", isPrimary: false },
            { tenantId: owner.tenant.id, athleteId: other.id,
                classification: "POWER", isPrimary: true },
        ] });
        expect(await goals.execute(owner.tenant.id, owner.user.id, athlete.id)).toEqual({
            athleteId: athlete.id, primaryGoal: "STRENGTH",
            secondaryGoals: ["ENDURANCE", "MOBILITY"],
        });
    });
});

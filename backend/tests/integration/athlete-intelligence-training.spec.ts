import { describe, expect, it } from "vitest";
import { ReadAthleteIntelligenceTraining } from "../../src/application/intelligence/athlete-training";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthleteTrainingReader } from "../../src/infrastructure/queries/athlete-intelligence-training.query";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const training = new ReadAthleteIntelligenceTraining(
    new PrismaAthleteIntelligenceContextReader(database),
    authorizationModule.authorizationService,
    new PrismaAthleteTrainingReader(database),
);

describe("Mission 071.2 scoped training integration", () => {
    it("requires both an Athlete relationship and the tenant's programme read grant", async () => {
        const owner = await createTestUser();
        const professional = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["workout-programmes.read"] });
        const noGrant = await createTestUser({ tenantId: owner.tenant.id });
        const foreign = await createTestUser({ permissions: ["workout-programmes.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Training", lastName: "Scope",
        } });
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: noGrant.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        expect(await training.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        expect(await training.execute(owner.tenant.id, noGrant.user.id, athlete.id)).toBeNull();
        expect(await training.execute(owner.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await training.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await training.execute(owner.tenant.id, professional.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, programmes: [] });
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { status: "INACTIVE" },
        });
        expect(await training.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
    });

    it("returns at most 20 active programmes for the authorised Athlete", async () => {
        const owner = await createTestUser({ permissions: ["workout-programmes.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Own", lastName: "Training",
        } });
        const other = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, firstName: "Other", lastName: "Training",
        } });
        const base = { tenantId: owner.tenant.id, goal: "Fitness", experience: "BEGINNER",
            trainingFrequency: 3, sessionDurationMinutes: 45 };
        await testPrisma.workoutProgramme.createMany({ data: [
            ...Array.from({ length: 22 }, (_, i) => ({ ...base, athleteId: athlete.id, name: `Active ${i}` })),
            { ...base, athleteId: athlete.id, name: "Hidden inactive", status: "INACTIVE" },
            { ...base, athleteId: other.id, name: "Hidden other" },
        ] });
        const result = await training.execute(owner.tenant.id, owner.user.id, athlete.id);
        expect(result?.athleteId).toBe(athlete.id);
        expect(result?.programmes).toHaveLength(20);
        expect(result?.programmes.every((programme) => programme.status === "ACTIVE")).toBe(true);
        expect(result?.programmes.map(({ name }) => name)).not.toContain("Hidden inactive");
        expect(result?.programmes.map(({ name }) => name)).not.toContain("Hidden other");
    });
});

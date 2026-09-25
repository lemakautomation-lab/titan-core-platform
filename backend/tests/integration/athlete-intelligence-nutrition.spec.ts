import { describe, expect, it } from "vitest";
import { ReadAthleteIntelligenceNutrition } from "../../src/application/intelligence/athlete-nutrition";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthleteNutritionReader } from "../../src/infrastructure/queries/athlete-intelligence-nutrition.query";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const nutrition = new ReadAthleteIntelligenceNutrition(
    new PrismaAthleteIntelligenceContextReader(database),
    authorizationModule.authorizationService,
    new PrismaAthleteNutritionReader(database),
);

describe("Mission 071.3 scoped nutrition integration", () => {
    it("requires a current Athlete relationship and the independent tenant read grant", async () => {
        const owner = await createTestUser({ permissions: ["nutrition-plans.generate"] });
        const professional = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["nutrition-plans.read"] });
        const foreign = await createTestUser({ permissions: ["nutrition-plans.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Nutrition", lastName: "Scope",
        } });
        expect(await nutrition.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        expect(await nutrition.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
        expect(await nutrition.execute(owner.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await nutrition.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        expect(await nutrition.execute(owner.tenant.id, professional.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, latestGeneratedPlan: null, activeMealPlans: [] });
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { endsAt: new Date(Date.now() - 1000) },
        });
        expect(await nutrition.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
    });

    it("returns only the latest generated plan metadata and up to 20 active meal plans", async () => {
        const owner = await createTestUser({ permissions: ["nutrition-plans.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Own", lastName: "Nutrition",
        } });
        const other = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, firstName: "Other", lastName: "Nutrition",
        } });
        const old = await testPrisma.nutritionPlan.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id, idempotencyKey: `old-${athlete.id}`,
            requestFingerprint: "old", requestFingerprintVersion: "1", generatorId: "test",
            generatorVersion: "1", inputSnapshot: { private: "input" },
            planSnapshot: { private: "contents" }, createdAt: new Date("2025-01-01"),
        } });
        const latest = await testPrisma.nutritionPlan.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id, idempotencyKey: `new-${athlete.id}`,
            requestFingerprint: "new", requestFingerprintVersion: "1", generatorId: "test",
            generatorVersion: "1", inputSnapshot: { private: "input" },
            planSnapshot: { private: "contents" }, createdAt: new Date("2025-01-02"),
        } });
        await testPrisma.mealPlan.createMany({ data: [
            ...Array.from({ length: 22 }, (_, i) => ({ tenantId: owner.tenant.id,
                athleteId: athlete.id, name: `Active ${i}`, status: "ACTIVE" as const,
                planSnapshot: { private: "meal" },
            })),
            { tenantId: owner.tenant.id, athleteId: athlete.id, name: "Hidden archived",
                status: "ARCHIVED" as const, planSnapshot: {} },
            { tenantId: owner.tenant.id, athleteId: other.id, name: "Hidden other",
                status: "ACTIVE" as const, planSnapshot: {} },
        ] });
        const result = await nutrition.execute(owner.tenant.id, owner.user.id, athlete.id);
        expect(result?.latestGeneratedPlan).toEqual({ id: latest.id, createdAt: latest.createdAt });
        expect(result?.latestGeneratedPlan?.id).not.toBe(old.id);
        expect(result?.activeMealPlans).toHaveLength(20);
        expect(result?.activeMealPlans.map(({ name }) => name)).not.toContain("Hidden archived");
        expect(result?.activeMealPlans.map(({ name }) => name)).not.toContain("Hidden other");
        expect(JSON.stringify(result)).not.toContain("private");
    });
});

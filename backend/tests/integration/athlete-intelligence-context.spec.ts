import { describe, expect, it } from "vitest";
import { ResolveAthleteIntelligenceContext } from "../../src/application/intelligence/athlete-context";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const useCase = new ResolveAthleteIntelligenceContext(
    new PrismaAthleteIntelligenceContextReader(new DatabaseService()),
);

describe("Mission 071.1 authorised Athlete identity integration", () => {
    it("resolves only the active Athlete owned by the actor in the same tenant", async () => {
        const owner = await createTestUser();
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id,
            firstName: "Own", lastName: "Athlete",
        } });
        expect(await useCase.execute(owner.tenant.id, owner.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, organisationId: null });
        const outsider = await createTestUser({ tenantId: owner.tenant.id });
        expect(await useCase.execute(owner.tenant.id, outsider.user.id, athlete.id)).toBeNull();
        expect(await useCase.execute(outsider.tenant.id, outsider.user.id, "invalid")).toBeNull();
        await testPrisma.athlete.update({ where: { id: athlete.id }, data: { status: "INACTIVE" } });
        expect(await useCase.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
    });

    it("resolves only an active, current Performance Professional relationship", async () => {
        const owner = await createTestUser();
        const professional = await createTestUser({ tenantId: owner.tenant.id });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id,
            firstName: "Linked", lastName: "Athlete",
        } });
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id,
            relationshipType: "PERFORMANCE_PROFESSIONAL",
            startsAt: new Date(Date.now() - 60_000), endsAt: new Date(Date.now() + 60_000),
        } });
        expect(await useCase.execute(owner.tenant.id, professional.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, organisationId: null });
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { endsAt: new Date(Date.now() - 1_000) },
        });
        expect(await useCase.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { endsAt: null, status: "INACTIVE" },
        });
        expect(await useCase.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
    });

    it("rejects cross-tenant identities and unrelated relationship types", async () => {
        const owner = await createTestUser();
        const foreign = await createTestUser();
        const coach = await createTestUser({ tenantId: owner.tenant.id });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, firstName: "Protected", lastName: "Athlete",
        } });
        await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: coach.user.id, relationshipType: "COACH",
        } });
        expect(await useCase.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await useCase.execute(owner.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await useCase.execute(owner.tenant.id, coach.user.id, athlete.id)).toBeNull();
        expect(await useCase.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
    });
});

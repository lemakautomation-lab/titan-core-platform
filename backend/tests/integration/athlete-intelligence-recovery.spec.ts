import { describe, expect, it } from "vitest";
import { ReadAthleteIntelligenceRecovery } from "../../src/application/intelligence/athlete-recovery";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthleteRecoveryReader } from "../../src/infrastructure/queries/athlete-intelligence-recovery.query";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const database = new DatabaseService();
const recovery = new ReadAthleteIntelligenceRecovery(
    new PrismaAthleteIntelligenceContextReader(database),
    authorizationModule.authorizationService,
    new PrismaAthleteRecoveryReader(database),
);

describe("Mission 071.4 scoped recovery integration", () => {
    it("requires both a current relationship and an independent tenant read grant", async () => {
        const owner = await createTestUser({ permissions: ["performance-measurements.read"] });
        const professional = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["recovery-tracking.read"] });
        const foreign = await createTestUser({ permissions: ["recovery-tracking.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Recovery", lastName: "Scope",
        } });
        expect(await recovery.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        expect(await recovery.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
        expect(await recovery.execute(owner.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect(await recovery.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        const relationship = await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        expect(await recovery.execute(owner.tenant.id, professional.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, observations: [] });
        await testPrisma.athleteRelationship.update({ where: { id: relationship.id },
            data: { startsAt: new Date(Date.now() + 60_000) },
        });
        expect(await recovery.execute(owner.tenant.id, professional.user.id, athlete.id)).toBeNull();
    });

    it("returns at most 20 raw observations for the authorised Athlete, newest first", async () => {
        const owner = await createTestUser({ permissions: ["recovery-tracking.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id, firstName: "Own", lastName: "Recovery",
        } });
        const other = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, firstName: "Other", lastName: "Recovery",
        } });
        const sourceId = athlete.id;
        await testPrisma.recoveryTracking.createMany({ data: [
            ...Array.from({ length: 22 }, (_, i) => ({ tenantId: owner.tenant.id,
                athleteId: athlete.id, sourceType: "TEST", sourceId,
                sourceObservationId: `recovery-${i}`, value: "82.123456",
                recordedAt: new Date(Date.UTC(2025, 0, 1, 0, i)),
            })),
            { tenantId: owner.tenant.id, athleteId: other.id, sourceType: "TEST",
                sourceId, sourceObservationId: "other", value: "1",
                recordedAt: new Date("2026-01-01"),
            },
        ] });
        const result = await recovery.execute(owner.tenant.id, owner.user.id, athlete.id);
        expect(result?.observations).toHaveLength(20);
        expect(result?.observations[0].value).toBe("82.123456");
        expect(result?.observations[0].recordedAt).toEqual(new Date(Date.UTC(2025, 0, 1, 0, 21)));
        expect(result?.observations.at(-1)?.recordedAt)
            .toEqual(new Date(Date.UTC(2025, 0, 1, 0, 2)));
        expect(JSON.stringify(result)).not.toContain("sourceObservationId");
    });
});

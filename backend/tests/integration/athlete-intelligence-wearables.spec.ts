import { describe, expect, it } from "vitest";
import {
    IngestVerifiedWearableObservation, ManageAthleteWearableConsent,
    ReadAthleteIntelligenceWearables, VerifiedWearableConnector,
} from "../../src/application/intelligence/athlete-wearables";
import { authorizationModule } from "../../src/infrastructure/composition/authorization.module";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { PrismaAthleteIntelligenceContextReader } from "../../src/infrastructure/queries/athlete-intelligence-context.query";
import { PrismaAthleteWearableReader } from "../../src/infrastructure/queries/athlete-intelligence-wearables.query";
import { PrismaAthleteWearableStore } from "../../src/infrastructure/queries/athlete-wearable.store";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

/** Test stand-in for a provider verifier; no live connector is claimed. */
const connector: VerifiedWearableConnector = {
    async verifyAccount(proof) {
        if (proof !== "valid-proof") throw new Error("Provider verification failed.");
        return { provider: "GARMIN", subject: "verified-provider-subject" };
    },
    async verifyObservation(payload) {
        if (!payload || typeof payload !== "object" || !("recordId" in payload)) {
            throw new Error("Provider verification failed.");
        }
        return { provider: "GARMIN", subject: "verified-provider-subject",
            recordId: String(payload.recordId), metricCode: "HEART_RATE",
            value: "72.500000", unit: "bpm", observedAt: new Date("2026-09-25T12:00:00Z"),
        };
    },
};

const database = new DatabaseService();
const context = new PrismaAthleteIntelligenceContextReader(database);
const store = new PrismaAthleteWearableStore(database, "test-only-wearable-identity-key-32-characters");
const consent = new ManageAthleteWearableConsent(context, connector, store);
const ingest = new IngestVerifiedWearableObservation(connector, store);
const read = new ReadAthleteIntelligenceWearables(context,
    authorizationModule.authorizationService, new PrismaAthleteWearableReader(database));

describe("Mission 071.5 wearable provenance foundation", () => {
    it("requires owner consent and independent read grant, then hides data on revocation", async () => {
        const owner = await createTestUser({ permissions: ["wearable-observations.read"] });
        const professional = await createTestUser({ tenantId: owner.tenant.id,
            permissions: ["wearable-observations.read"] });
        const foreign = await createTestUser({ permissions: ["wearable-observations.read"] });
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id,
            firstName: "Wearable", lastName: "Owner",
        } });
        await testPrisma.athleteRelationship.create({ data: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
            relatedEntityId: professional.user.id, relationshipType: "PERFORMANCE_PROFESSIONAL",
        } });
        await expect(consent.grant(owner.tenant.id, professional.user.id, athlete.id, "valid-proof"))
            .rejects.toThrow("Athlete consent requires the active owner.");
        await expect(consent.grant(owner.tenant.id, owner.user.id, athlete.id, "bad-proof"))
            .rejects.toThrow("Provider verification failed.");
        const connection = await consent.grant(owner.tenant.id, owner.user.id, athlete.id, "valid-proof");
        expect(connection).toBeTruthy();
        const observation = await ingest.execute({ recordId: "verified-record-1" });
        expect(observation).toBeTruthy();
        expect(await ingest.execute({ recordId: "verified-record-1" })).toEqual(observation);

        expect(await read.execute(foreign.tenant.id, foreign.user.id, athlete.id)).toBeNull();
        expect((await read.execute(owner.tenant.id, professional.user.id, athlete.id))?.observations)
            .toHaveLength(1);
        expect(await read.execute(owner.tenant.id, owner.user.id, athlete.id)).toMatchObject({
            athleteId: athlete.id, observations: [{ id: observation?.id,
                provider: "GARMIN", metricCode: "HEART_RATE", value: "72.5", unit: "bpm" }],
        });
        expect(await consent.revoke(owner.tenant.id, owner.user.id, athlete.id, connection!.id)).toBe(true);
        expect(await ingest.execute({ recordId: "verified-record-2" })).toBeNull();
        expect(await read.execute(owner.tenant.id, owner.user.id, athlete.id))
            .toEqual({ athleteId: athlete.id, observations: [] });
        expect(await testPrisma.wearableObservation.count({ where: { id: observation!.id } })).toBe(1);
        expect(await testPrisma.auditLog.count({ where: { tenantId: owner.tenant.id,
            resource: "WEARABLE_CONNECTION", resourceId: connection!.id } })).toBe(2);
    });

    it("rejects unverified subjects and invalid observations; never trusts source labels", async () => {
        const owner = await createTestUser();
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: owner.tenant.id, userId: owner.user.id,
            firstName: "Wearable", lastName: "Scope",
        } });
        expect(await read.execute(owner.tenant.id, owner.user.id, athlete.id)).toBeNull();
        const missing = await store.ingest({ provider: "GARMIN", subject: "unlinked-subject",
            recordId: "r", metricCode: "STEPS", value: "10", unit: "count",
            observedAt: new Date("2026-09-25T12:00:00Z") });
        expect(missing).toBeNull();
        await expect(store.ingest({ provider: "GARMIN", subject: "unlinked-subject",
            recordId: "r", metricCode: "HEART_RATE", value: "999", unit: "bpm",
            observedAt: new Date("2026-09-25T12:00:00Z") })).rejects.toThrow();
        expect(await testPrisma.wearableObservation.count({ where: {
            tenantId: owner.tenant.id, athleteId: athlete.id,
        } })).toBe(0);
    });
});

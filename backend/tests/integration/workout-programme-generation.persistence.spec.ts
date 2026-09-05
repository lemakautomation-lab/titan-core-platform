import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { WorkoutProgrammeGeneration } from "../../src/domain/entities/workout-programme-generation.entity";
import { WorkoutProgrammeGenerationMapper } from "../../src/infrastructure/mappers/workout-programme-generation.mapper";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const fingerprint = "a".repeat(64);
const planFingerprint = "b".repeat(64);

async function context() {
    const owner = await createTestUser();
    const other = await createTestUser();
    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId: owner.tenant.id,
            firstName: "Generation",
            lastName: "Athlete",
        },
    });
    const programme = await testPrisma.workoutProgramme.create({
        data: {
            tenantId: owner.tenant.id,
            athleteId: athlete.id,
            name: "Generated programme",
            goal: "STRENGTH",
            experience: "BEGINNER",
            trainingFrequency: 1,
            sessionDurationMinutes: 30,
        },
    });
    return { owner, other, programme };
}

function data(tenantId: string, programmeId: string) {
    return {
        id: randomUUID(),
        tenantId,
        programmeId,
        actorUserId: "actor-1",
        idempotencyKey: `key-${randomUUID()}`,
        requestFingerprint: fingerprint,
        requestFingerprintVersion: "1",
        planFingerprint,
        rulesetId: "TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION",
        rulesetVersion: "1.0.0",
        inputSnapshot: { athleteId: "athlete-1" },
        planSnapshot: { sessions: [] },
    } as const;
}

describe("Workout Programme generation provenance persistence", () => {
    it("keeps manual Programmes valid without provenance", async () => {
        const { programme } = await context();
        expect(await testPrisma.workoutProgrammeGeneration.findUnique({
            where: { programmeId_tenantId: {
                programmeId: programme.id,
                tenantId: programme.tenantId,
            } },
        })).toBeNull();
    });

    it("persists and maps immutable same-tenant provenance", async () => {
        const { owner, programme } = await context();
        const created = await testPrisma.workoutProgrammeGeneration.create({
            data: data(owner.tenant.id, programme.id),
        });
        const domain = WorkoutProgrammeGenerationMapper.toDomain(created);
        expect(domain.programmeId).toBe(programme.id);
        expect(domain.requestFingerprint).toBe(fingerprint);
        expect(Object.isFrozen(domain.inputSnapshot)).toBe(true);
    });

    it("rejects cross-tenant Programme association", async () => {
        const { other, programme } = await context();
        await expect(testPrisma.workoutProgrammeGeneration.create({
            data: data(other.tenant.id, programme.id),
        })).rejects.toBeDefined();
    });

    it("rejects duplicate tenant keys and duplicate Programme provenance", async () => {
        const { owner, programme } = await context();
        const first = data(owner.tenant.id, programme.id);
        await testPrisma.workoutProgrammeGeneration.create({ data: first });

        const secondAthlete = await testPrisma.athlete.create({
            data: { tenantId: owner.tenant.id, firstName: "Other", lastName: "Athlete" },
        });
        const secondProgramme = await testPrisma.workoutProgramme.create({
            data: {
                tenantId: owner.tenant.id,
                athleteId: secondAthlete.id,
                name: "Second", goal: "STRENGTH", experience: "BEGINNER",
                trainingFrequency: 1, sessionDurationMinutes: 30,
            },
        });
        await expect(testPrisma.workoutProgrammeGeneration.create({
            data: { ...data(owner.tenant.id, secondProgramme.id), idempotencyKey: first.idempotencyKey },
        })).rejects.toBeDefined();
        await expect(testPrisma.workoutProgrammeGeneration.create({
            data: data(owner.tenant.id, programme.id),
        })).rejects.toBeDefined();
    });

    it.each([
        ["invalid key", { idempotencyKey: "bad key" }],
        ["invalid request fingerprint", { requestFingerprint: "A".repeat(64) }],
        ["invalid plan fingerprint", { planFingerprint: "short" }],
        ["unsupported version", { requestFingerprintVersion: "2" }],
        ["blank ruleset", { rulesetId: "   " }],
        ["blank actor", { actorUserId: " " }],
    ])("rejects %s at the database boundary", async (_name, override) => {
        const { owner, programme } = await context();
        await expect(testPrisma.workoutProgrammeGeneration.create({
            data: { ...data(owner.tenant.id, programme.id), ...override },
        })).rejects.toBeDefined();
    });

    it("cascades Programme identity updates and hard deletion", async () => {
        const { owner, programme } = await context();
        await testPrisma.workoutProgrammeGeneration.create({
            data: data(owner.tenant.id, programme.id),
        });
        const movedId = randomUUID();
        await testPrisma.$executeRawUnsafe(
            'UPDATE "WorkoutProgramme" SET "id" = $1 WHERE "id" = $2',
            movedId,
            programme.id,
        );
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { programmeId: movedId },
        })).toBe(1);
        await testPrisma.workoutProgramme.delete({ where: { id: movedId } });
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { programmeId: movedId },
        })).toBe(0);
    });
});

import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../../src/app";
import { PrismaGeneratedWorkoutProgrammeReadRepository } from "../../src/infrastructure/repositories/generated-workout-programme-read.repository";
import { GetWorkoutProgrammeByIdUseCase } from "../../src/application/use-cases/get-workout-programme-by-id.use-case";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

async function login(user: Awaited<ReturnType<typeof createTestUser>>) {
    const response = await request(app).post("/api/v1/auth/login").send({
        tenantId: user.tenant.id,
        email: user.user.email,
        password: user.password,
    });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

async function createGenerated(
    permissions: string[] = [
        "workout-programmes.generate",
        "workout-programmes.read",
    ],
) {
    const user = await createTestUser({ permissions });
    const token = await login(user);
    const suffix = crypto.randomUUID();
    const athlete = await testPrisma.athlete.create({
        data: {
            tenantId: user.tenant.id,
            firstName: "R6R",
            lastName: suffix,
        },
    });
    const exercise = await testPrisma.exercise.create({
        data: {
            tenantId: user.tenant.id,
            name: `R6R Exercise ${suffix}`,
            slug: `r6r-exercise-${suffix}`,
            muscleGroups: [],
            equipment: [],
            difficulty: "BEGINNER",
            trainingObjective: "STRENGTH",
            movement: "GENERAL",
            trainingPhase: "GENERAL",
            sportId: null,
            status: "ACTIVE",
        },
    });
    await testPrisma.exercisePrescriptionProfile.create({
        data: {
            tenantId: user.tenant.id,
            exerciseId: exercise.id,
            goalClassification: "STRENGTH",
            trainingExperience: "BEGINNER",
            prescriptionMode: "REPETITIONS",
            defaultSets: 3,
            defaultRepetitions: 8,
            defaultDurationSeconds: null,
            defaultRestSeconds: 60,
            estimatedSetDurationSeconds: 30,
            version: 1,
            status: "ACTIVE",
        },
    });
    const generated = await request(app)
        .post("/api/v1/workout-programmes/generations")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", `r6r.${suffix}`)
        .send({
            athleteId: athlete.id,
            goalClassification: "STRENGTH",
            trainingExperience: "BEGINNER",
            sportId: null,
            availableEquipment: [],
            trainingFrequency: 1,
            sessionDurationMinutes: 30,
        });
    expect(generated.status).toBe(201);
    return { user, token, generated: generated.body };
}

function retrieve(token: string, generationId: string) {
    return request(app)
        .get(`/api/v1/workout-programmes/generations/${generationId}`)
        .set("Authorization", `Bearer ${token}`);
}

function expectGenericNotFound(response: request.Response) {
    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
        code: "GENERATED_PROGRAMME_NOT_FOUND",
        message: "Generated Workout Programme not found.",
    });
}

describe("Generated Workout Programme retrieval API", () => {
    it("requires authentication", async () => {
        const response = await request(app).get(
            `/api/v1/workout-programmes/generations/${crypto.randomUUID()}`,
        );
        expect(response.status).toBe(401);
    });

    it("denies without read permission before repository access", async () => {
        const user = await createTestUser({ permissions: [
            "workout-programmes.generate",
        ] });
        const token = await login(user);
        const read = vi.spyOn(
            PrismaGeneratedWorkoutProgrammeReadRepository.prototype,
            "findCompleteByGenerationId",
        );
        const response = await retrieve(token, crypto.randomUUID());
        expect(response.status).toBe(403);
        expect(read).not.toHaveBeenCalled();
        read.mockRestore();
    });

    it("does not let generation permission alone grant retrieval", async () => {
        const user = await createTestUser({ permissions: [
            "workout-programmes.generate",
        ] });
        const token = await login(user);
        const response = await retrieve(token, crypto.randomUUID());
        expect(response.status).toBe(403);
    });

    it("returns the complete same-tenant ACTIVE structure in stable order", async () => {
        const data = await createGenerated();
        const ordinaryRead = vi.spyOn(
            GetWorkoutProgrammeByIdUseCase.prototype,
            "execute",
        );
        const response = await retrieve(
            data.token,
            data.generated.generationId,
        );
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            generationId: data.generated.generationId,
            programme: data.generated.programme,
        });
        expect(response.body.programme.sessions.map(
            (session: { ordinal: number }) => session.ordinal,
        )).toEqual([1]);
        expect(response.body.programme.sessions[0].exercises.map(
            (item: { ordinal: number }) => item.ordinal,
        )).toEqual([1]);
        expect(ordinaryRead).not.toHaveBeenCalled();
        ordinaryRead.mockRestore();
    });

    it("recursively omits all provenance and authority internals", async () => {
        const data = await createGenerated();
        const response = await retrieve(data.token, data.generated.generationId);
        const serialized = JSON.stringify(response.body);
        for (const field of [
            "tenantId",
            "actorUserId",
            "idempotencyKey",
            "requestFingerprint",
            "planFingerprint",
            "inputSnapshot",
            "planSnapshot",
            "profileId",
            "profileVersion",
            "rulesetId",
            "rulesetVersion",
        ]) {
            expect(serialized).not.toContain(`\"${field}\"`);
        }
        expect(response.body).not.toHaveProperty("replayed");
    });

    it("returns identical generic 404 for missing and cross-tenant identities", async () => {
        const owner = await createGenerated();
        const reader = await createTestUser({ permissions: [
            "workout-programmes.read",
        ] });
        const readerToken = await login(reader);
        const missing = await retrieve(readerToken, crypto.randomUUID());
        const crossTenant = await retrieve(
            readerToken,
            owner.generated.generationId,
        );
        expectGenericNotFound(missing);
        expectGenericNotFound(crossTenant);
        expect(crossTenant.status).toBe(missing.status);
        expect(crossTenant.body.error).toEqual(missing.body.error);
    });

    it.each(["INACTIVE", "SUSPENDED", "DELETED"] as const)(
        "returns the same generic 404 for a %s Programme",
        async status => {
            const data = await createGenerated();
            await testPrisma.workoutProgramme.update({
                where: { id: data.generated.programme.id },
                data: { status },
            });
            expectGenericNotFound(await retrieve(
                data.token,
                data.generated.generationId,
            ));
        },
    );

    it("rejects an invalid UUID before repository access", async () => {
        const user = await createTestUser({ permissions: [
            "workout-programmes.read",
        ] });
        const token = await login(user);
        const read = vi.spyOn(
            PrismaGeneratedWorkoutProgrammeReadRepository.prototype,
            "findCompleteByGenerationId",
        );
        const response = await retrieve(token, "not-a-uuid");
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(read).not.toHaveBeenCalled();
        read.mockRestore();
    });

    it("fails generically for a missing structure", async () => {
        const data = await createGenerated();
        await testPrisma.workoutProgrammeSession.deleteMany({
            where: {
                programmeId: data.generated.programme.id,
                tenantId: data.user.tenant.id,
            },
        });
        const response = await retrieve(data.token, data.generated.generationId);
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("fails generically for a session without prescriptions", async () => {
        const data = await createGenerated();
        await testPrisma.workoutProgrammeExercisePrescription.deleteMany({
            where: { tenantId: data.user.tenant.id },
        });
        const response = await retrieve(data.token, data.generated.generationId);
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("maps infrastructure details to a generic 500", async () => {
        const user = await createTestUser({ permissions: [
            "workout-programmes.read",
        ] });
        const token = await login(user);
        const read = vi.spyOn(
            PrismaGeneratedWorkoutProgrammeReadRepository.prototype,
            "findCompleteByGenerationId",
        ).mockRejectedValueOnce(new Error("private database detail"));
        const response = await retrieve(token, crypto.randomUUID());
        read.mockRestore();
        expect(response.status).toBe(500);
        expect(response.body.error).toEqual({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred.",
        });
        expect(JSON.stringify(response.body)).not.toContain(
            "private database detail",
        );
    });

    it("is repeatable and creates no rows or audit events", async () => {
        const data = await createGenerated();
        const tenantId = data.user.tenant.id;
        const before = {
            programmes: await testPrisma.workoutProgramme.count({ where: { tenantId } }),
            generations: await testPrisma.workoutProgrammeGeneration.count({ where: { tenantId } }),
            sessions: await testPrisma.workoutProgrammeSession.count({ where: { tenantId } }),
            prescriptions: await testPrisma.workoutProgrammeExercisePrescription.count({ where: { tenantId } }),
            audits: await testPrisma.auditLog.count({ where: {
                tenantId,
                action: "WORKOUT_PROGRAMME_GENERATED",
            } }),
        };
        const first = await retrieve(data.token, data.generated.generationId);
        const second = await retrieve(data.token, data.generated.generationId);
        expect(first.status).toBe(200);
        expect(second.body).toEqual(first.body);
        expect({
            programmes: await testPrisma.workoutProgramme.count({ where: { tenantId } }),
            generations: await testPrisma.workoutProgrammeGeneration.count({ where: { tenantId } }),
            sessions: await testPrisma.workoutProgrammeSession.count({ where: { tenantId } }),
            prescriptions: await testPrisma.workoutProgrammeExercisePrescription.count({ where: { tenantId } }),
            audits: await testPrisma.auditLog.count({ where: {
                tenantId,
                action: "WORKOUT_PROGRAMME_GENERATED",
            } }),
        }).toEqual(before);
    });
});

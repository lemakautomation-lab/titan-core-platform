import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../../src/app";
import { GenerateWorkoutProgrammeUseCase } from "../../src/application/use-cases/generate-workout-programme.use-case";
import { PrismaWorkoutProgrammeGenerationTransaction } from "../../src/infrastructure/transactions/workout-programme-generation.transaction";
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

async function fixtures(
    tenantId: string,
    options: {
        goal?: string;
        experience?: string;
        equipment?: string[];
        sportId?: string | null;
    } = {},
) {
    const suffix = crypto.randomUUID();
    const athlete = await testPrisma.athlete.create({
        data: { tenantId, firstName: "R6", lastName: suffix },
    });
    const exercise = await testPrisma.exercise.create({
        data: {
            tenantId,
            name: `R6 Exercise ${suffix}`,
            slug: `r6-exercise-${suffix}`,
            muscleGroups: [],
            equipment: options.equipment ?? [],
            difficulty: options.experience ?? "BEGINNER",
            trainingObjective: options.goal ?? "STRENGTH",
            movement: "GENERAL",
            trainingPhase: "GENERAL",
            sportId: options.sportId ?? null,
            status: "ACTIVE",
        },
    });
    await testPrisma.exercisePrescriptionProfile.create({
        data: {
            tenantId,
            exerciseId: exercise.id,
            goalClassification: options.goal ?? "STRENGTH",
            trainingExperience: options.experience ?? "BEGINNER",
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
    return { athlete, exercise };
}

function body(athleteId: string) {
    return {
        athleteId,
        goalClassification: "STRENGTH",
        trainingExperience: "BEGINNER",
        sportId: null,
        availableEquipment: [],
        trainingFrequency: 1,
        sessionDurationMinutes: 30,
    };
}

function generation(token: string, key: string, payload: object) {
    return request(app)
        .post("/api/v1/workout-programmes/generations")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", key)
        .send(payload);
}

describe("Workout Programme generation API", () => {
    it("requires authentication before generation authorization", async () => {
        const response = await request(app)
            .post("/api/v1/workout-programmes/generations")
            .set("Idempotency-Key", "r6-auth")
            .send({});
        expect(response.status).toBe(401);
    });

    it("requires the dedicated permission and records one denial without writes", async () => {
        const execute = vi.spyOn(
            GenerateWorkoutProgrammeUseCase.prototype,
            "execute",
        );
        const user = await createTestUser({ permissions: [
            "workout-programmes.create",
            "workout-programmes.update",
        ] });
        const token = await login(user);
        const beforeEvents = await testPrisma.securityEvent.count({ where: {
            tenantId: user.tenant.id,
            userId: user.user.id,
            eventType: "AUTHORIZATION_FAILURE",
        } });
        const beforeGenerations = await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: user.tenant.id },
        });

        const response = await generation(token, "r6-denied", {});
        expect(response.status).toBe(403);
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: user.tenant.id },
        })).toBe(beforeGenerations);
        const events = await testPrisma.securityEvent.findMany({ where: {
            tenantId: user.tenant.id,
            userId: user.user.id,
            eventType: "AUTHORIZATION_FAILURE",
        }, orderBy: { createdAt: "asc" } });
        expect(events).toHaveLength(beforeEvents + 1);
        expect(events.at(-1)?.metadata).toMatchObject({
            permission: "workout-programmes.generate",
            method: "POST",
        });
        expect(execute).not.toHaveBeenCalled();
        execute.mockRestore();
    });

    it("does not let generation permission imply CRUD permissions", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        expect((await request(app).get("/api/v1/workout-programmes")
            .set("Authorization", `Bearer ${token}`)).status).toBe(403);
    });

    it.each([
        ["missing key", undefined],
        ["malformed key", "bad key"],
        ["oversized key", "a".repeat(201)],
    ])("rejects %s", async (_label, key) => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const call = request(app)
            .post("/api/v1/workout-programmes/generations")
            .set("Authorization", `Bearer ${token}`)
            .send(body(crypto.randomUUID()));
        if (key !== undefined) call.set("Idempotency-Key", key);
        const response = await call;
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects repeated Idempotency-Key values", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const response = await request(app)
            .post("/api/v1/workout-programmes/generations")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", ["first", "second"])
            .send(body(crypto.randomUUID()));
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it.each([
        "tenantId", "actorUserId", "userId", "candidateIds", "exerciseIds",
        "profileIds", "prescriptions", "rulesetId", "requestFingerprint",
        "generationId", "programmeId", "unknown",
    ])("rejects prohibited or unknown field %s", async field => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const response = await generation(token, `r6-field-${field}`, {
            ...body(crypto.randomUUID()),
            [field]: "attacker-controlled",
        });
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("creates, replays, conflicts and exposes only the bounded response", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const { athlete } = await fixtures(user.tenant.id);
        const key = `r6.${crypto.randomUUID()}`;
        const payload = body(athlete.id);

        const created = await generation(token, key, payload);
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({
            replayed: false,
            generationId: expect.any(String),
            programme: {
                athleteId: athlete.id,
                goal: "STRENGTH",
                experience: "BEGINNER",
                sessions: [{
                    ordinal: 1,
                    exercises: [{
                        ordinal: 1,
                        sets: 3,
                        repetitions: 8,
                        durationSeconds: null,
                        restSeconds: 60,
                    }],
                }],
            },
        });
        const serialized = JSON.stringify(created.body);
        for (const forbidden of [
            "tenantId", "actorUserId", "idempotencyKey", "requestFingerprint",
            "planFingerprint", "inputSnapshot", "planSnapshot", "profileId",
            "rulesetId", "rulesetVersion",
        ]) expect(serialized).not.toContain(forbidden);

        const replayed = await generation(token, key, payload);
        expect(replayed.status).toBe(200);
        expect(replayed.body).toMatchObject({
            replayed: true,
            generationId: created.body.generationId,
            programme: { id: created.body.programme.id },
        });

        const conflict = await generation(token, key, {
            ...payload,
            trainingFrequency: 2,
        });
        expect(conflict.status).toBe(409);
        expect(conflict.body.error.code).toBe("IDEMPOTENCY_CONFLICT");

        expect(await testPrisma.auditLog.count({ where: {
            tenantId: user.tenant.id,
            action: "WORKOUT_PROGRAMME_GENERATED",
            resourceId: created.body.programme.id,
        } })).toBe(1);
    });

    it("derives tenant and actor authority and hides unavailable inputs", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const foreign = await createTestUser();
        const token = await login(user);
        const foreignFixtures = await fixtures(foreign.tenant.id);

        for (const athleteId of [crypto.randomUUID(), foreignFixtures.athlete.id]) {
            const response = await generation(
                token,
                `r6-unavailable-${crypto.randomUUID()}`,
                body(athleteId),
            );
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual({
                code: "GENERATION_INPUT_UNAVAILABLE",
                message: "Generation input is unavailable.",
            });
        }
    });

    it("returns an explicit unsatisfiable result without persistence", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: user.tenant.id,
            firstName: "No",
            lastName: "Candidates",
        } });
        const before = await testPrisma.workoutProgramme.count({
            where: { tenantId: user.tenant.id },
        });
        const response = await generation(
            token,
            `r6-empty-${crypto.randomUUID()}`,
            body(athlete.id),
        );
        expect(response.status).toBe(422);
        expect(response.body.error.code).toBe(
            "PROGRAMME_GENERATION_UNSATISFIABLE",
        );
        expect(await testPrisma.workoutProgramme.count({
            where: { tenantId: user.tenant.id },
        })).toBe(before);
    });

    it("arbitrates concurrent identical HTTP requests", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const { athlete } = await fixtures(user.tenant.id);
        const key = `r6.concurrent.${crypto.randomUUID()}`;
        const responses = await Promise.all([
            generation(token, key, body(athlete.id)),
            generation(token, key, body(athlete.id)),
        ]);
        expect(responses.map(response => response.status).sort()).toEqual([200, 201]);
        expect(responses.map(response => response.body.replayed).sort()).toEqual([
            false,
            true,
        ]);
        expect(new Set(responses.map(response => response.body.generationId)).size)
            .toBe(1);
        expect(new Set(responses.map(response => response.body.programme.id)).size)
            .toBe(1);
    });

    it("accepts every canonical Goal through the public boundary", async () => {
        const goals = [
            "STRENGTH", "HYPERTROPHY", "ENDURANCE", "SPEED", "POWER",
            "MOBILITY", "CONDITIONING", "GENERAL_FITNESS", "SPORT_PERFORMANCE",
        ];
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);

        for (const goal of goals) {
            const { athlete } = await fixtures(user.tenant.id, { goal });
            const response = await generation(token, `r6.goal.${goal}`, {
                ...body(athlete.id),
                goalClassification: goal,
            });
            expect(response.status, goal).toBe(201);
            expect(response.body.programme.goal).toBe(goal);
        }
    });

    it("accepts every canonical training experience through the public boundary", async () => {
        const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);

        for (const experience of levels) {
            const { athlete } = await fixtures(user.tenant.id, { experience });
            const response = await generation(token, `r6.experience.${experience}`, {
                ...body(athlete.id),
                trainingExperience: experience,
            });
            expect(response.status, experience).toBe(201);
            expect(response.body.programme.experience).toBe(experience);
        }
    });

    it("normalizes equipment and supports an active non-null Sport", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const sport = await testPrisma.sport.create({ data: {
            tenantId: user.tenant.id,
            name: `R6 Sport ${crypto.randomUUID()}`,
            slug: `r6-sport-${crypto.randomUUID()}`,
            status: "ACTIVE",
        } });
        const { athlete } = await fixtures(user.tenant.id, {
            equipment: ["  Barbell  "],
            sportId: sport.id,
        });
        const response = await generation(token, `r6.equipment.${crypto.randomUUID()}`, {
            ...body(athlete.id),
            sportId: sport.id,
            availableEquipment: [" BARBELL ", "barbell"],
        });
        expect(response.status).toBe(201);
        expect(response.body.programme.sportId).toBe(sport.id);
    });

    it("returns the same generic unavailable response for an inactive Sport", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const athlete = await testPrisma.athlete.create({ data: {
            tenantId: user.tenant.id,
            firstName: "Inactive",
            lastName: "Sport",
        } });
        const sport = await testPrisma.sport.create({ data: {
            tenantId: user.tenant.id,
            name: `Inactive ${crypto.randomUUID()}`,
            slug: `inactive-${crypto.randomUUID()}`,
            status: "INACTIVE",
        } });
        const response = await generation(token, `r6.inactive.${crypto.randomUUID()}`, {
            ...body(athlete.id),
            sportId: sport.id,
        });
        expect(response.status).toBe(404);
        expect(response.body.error).toEqual({
            code: "GENERATION_INPUT_UNAVAILABLE",
            message: "Generation input is unavailable.",
        });
    });

    it("maps transactional drift to 409 without partial persistence", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const { athlete } = await fixtures(user.tenant.id);
        const before = await testPrisma.workoutProgramme.count({
            where: { tenantId: user.tenant.id },
        });
        const execute = vi.spyOn(
            PrismaWorkoutProgrammeGenerationTransaction.prototype,
            "execute",
        ).mockRejectedValueOnce(
            new Error("Generation candidates changed during transaction."),
        );
        const response = await generation(token, `r6.drift.${crypto.randomUUID()}`, body(athlete.id));
        execute.mockRestore();
        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe("GENERATION_INPUT_CHANGED");
        expect(await testPrisma.workoutProgramme.count({
            where: { tenantId: user.tenant.id },
        })).toBe(before);
    });

    it("maps unresolved P2034 to 503 without partial persistence", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const { athlete } = await fixtures(user.tenant.id);
        const before = await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: user.tenant.id },
        });
        const execute = vi.spyOn(
            PrismaWorkoutProgrammeGenerationTransaction.prototype,
            "execute",
        ).mockRejectedValueOnce(Object.assign(new Error("write conflict"), {
            code: "P2034",
        }));
        const response = await generation(token, `r6.p2034.${crypto.randomUUID()}`, body(athlete.id));
        execute.mockRestore();
        expect(response.status).toBe(503);
        expect(response.body.error.code).toBe("GENERATION_TEMPORARILY_UNAVAILABLE");
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: user.tenant.id },
        })).toBe(before);
    });

    it.each([
        "Generated Programme invariant failure.",
        "unexpected infrastructure detail",
    ])("maps unknown internal failure generically without partial persistence", async message => {
        const user = await createTestUser({
            permissions: ["workout-programmes.generate"],
        });
        const token = await login(user);
        const { athlete } = await fixtures(user.tenant.id);
        const before = await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: user.tenant.id },
        });
        const execute = vi.spyOn(
            PrismaWorkoutProgrammeGenerationTransaction.prototype,
            "execute",
        ).mockRejectedValueOnce(new Error(message));
        const response = await generation(token, `r6.internal.${crypto.randomUUID()}`, body(athlete.id));
        execute.mockRestore();
        expect(response.status).toBe(500);
        expect(response.body.error).toEqual({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred.",
        });
        expect(JSON.stringify(response.body)).not.toContain(message);
        expect(await testPrisma.workoutProgrammeGeneration.count({
            where: { tenantId: user.tenant.id },
        })).toBe(before);
    });
});

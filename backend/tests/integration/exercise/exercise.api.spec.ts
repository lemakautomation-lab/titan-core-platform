import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";


describe("Exercise API Tenant Isolation and RBAC", () => {

    it(
        "creates, reads, updates, lists and deletes an exercise within the authenticated tenant",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "exercises.create",
                        "exercises.read",
                        "exercises.update",
                        "exercises.delete",
                    ],
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: user.tenant.id,
                        email: user.user.email,
                        password: user.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const createResponse =
                await request(app)
                    .post("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Back Squat",
                        slug: "back-squat",
                        description: "Barbell back squat",
                        movement: "Squat",
                        muscleGroups: ["quadriceps", "glutes"],
                        equipment: ["barbell"],
                        trainingObjective: "Strength",
                        difficulty: "Intermediate",
                        trainingPhase: "Strength",
                        sportId: null,
                    });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.tenantId).toBe(user.tenant.id);
            expect(createResponse.body.name).toBe("Back Squat");
            expect(createResponse.body.slug).toBe("back-squat");

            const exerciseId =
                createResponse.body.id;

            const getResponse =
                await request(app)
                    .get(`/api/v1/exercises/${exerciseId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.id).toBe(exerciseId);

            const listResponse =
                await request(app)
                    .get("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(listResponse.status).toBe(200);
            expect(
                listResponse.body.data.some(
                    (exercise: { id: string }) =>
                        exercise.id === exerciseId,
                ),
            ).toBe(true);

            const updateResponse =
                await request(app)
                    .put(`/api/v1/exercises/${exerciseId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Front Squat",
                        slug: "front-squat",
                        description: "Front-loaded squat",
                        movement: "Squat",
                        muscleGroups: ["quadriceps"],
                        equipment: ["barbell"],
                        trainingObjective: "Strength",
                        difficulty: "Intermediate",
                        trainingPhase: "Strength",
                        sportId: null,
                    });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.name).toBe("Front Squat");
            expect(updateResponse.body.slug).toBe("front-squat");

            const deleteResponse =
                await request(app)
                    .delete(`/api/v1/exercises/${exerciseId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(deleteResponse.status).toBe(204);

            const deletedResponse =
                await request(app)
                    .get(`/api/v1/exercises/${exerciseId}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(deletedResponse.status).toBe(404);
        },
    );


    it(
        "denies reading an exercise belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: ["exercises.read"],
                });

            const tenantBUser =
                await createTestUser();

            const exercise =
                await testPrisma.exercise.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        name: "Deadlift",
                        slug: "deadlift",
                        description: null,
                        movement: "Hinge",
                        muscleGroups: ["hamstrings"],
                        equipment: ["barbell"],
                        trainingObjective: "Strength",
                        difficulty: "Intermediate",
                        trainingPhase: null,
                        sportId: null,
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: tenantAUser.tenant.id,
                        email: tenantAUser.user.email,
                        password: tenantAUser.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get(`/api/v1/exercises/${exercise.id}`)
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(response.status).toBe(404);

            await testPrisma.exercise.delete({
                where: {
                    id: exercise.id,
                },
            });
        },
    );


    it(
        "does not list exercises belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: ["exercises.read"],
                });

            const tenantBUser =
                await createTestUser();

            const exercise =
                await testPrisma.exercise.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        name: "Bench Press",
                        slug: "bench-press",
                        description: null,
                        movement: "Push",
                        muscleGroups: ["chest"],
                        equipment: ["barbell"],
                        trainingObjective: "Strength",
                        difficulty: "Intermediate",
                        trainingPhase: null,
                        sportId: null,
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: tenantAUser.tenant.id,
                        email: tenantAUser.user.email,
                        password: tenantAUser.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(response.status).toBe(200);

            expect(
                response.body.data.some(
                    (item: { id: string }) =>
                        item.id === exercise.id,
                ),
            ).toBe(false);

            await testPrisma.exercise.delete({
                where: {
                    id: exercise.id,
                },
            });
        },
    );


    it(
        "enforces exercise permissions",
        async () => {

            const user =
                await createTestUser();

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: user.tenant.id,
                        email: user.user.email,
                        password: user.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .post("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Lunge",
                        slug: "lunge",
                        description: null,
                        movement: "Lunge",
                        muscleGroups: ["quadriceps"],
                        equipment: [],
                        trainingObjective: "Strength",
                        difficulty: "Beginner",
                        trainingPhase: null,
                        sportId: null,
                    });

            expect(response.status).toBe(403);
        },
    );


    it(
        "rejects duplicate exercise slugs within the same tenant",
        async () => {

            const user =
                await createTestUser({
                    permissions: ["exercises.create"],
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId: user.tenant.id,
                        email: user.user.email,
                        password: user.password,
                    });

            expect(loginResponse.status).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const firstResponse =
                await request(app)
                    .post("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Sprint",
                        slug: "sprint",
                        description: null,
                        movement: "Run",
                        muscleGroups: ["quadriceps"],
                        equipment: [],
                        trainingObjective: "Speed",
                        difficulty: "Intermediate",
                        trainingPhase: null,
                        sportId: null,
                    });

            expect(firstResponse.status).toBe(201);

            const duplicateResponse =
                await request(app)
                    .post("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name: "Sprint Running",
                        slug: "sprint",
                        description: null,
                        movement: "Run",
                        muscleGroups: ["quadriceps"],
                        equipment: [],
                        trainingObjective: "Speed",
                        difficulty: "Intermediate",
                        trainingPhase: null,
                        sportId: null,
                    });

            expect(duplicateResponse.status).toBe(400);

            await testPrisma.exercise.delete({
                where: {
                    id: firstResponse.body.id,
                },
            });
        },
    );

});

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

    it(
        "rejects creating an exercise with a sport belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: ["exercises.create"],
                });

            const tenantBUser =
                await createTestUser();

            const sport =
                await testPrisma.sport.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        name:
                            "Cross Tenant Sport",

                        slug:
                            "cross-tenant-sport",
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,

                        email:
                            tenantAUser.user.email,

                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

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
                        name:
                            "Cross Tenant Exercise",

                        slug:
                            "cross-tenant-exercise",

                        description:
                            null,

                        movement:
                            "Squat",

                        muscleGroups:
                            ["quadriceps"],

                        equipment:
                            ["barbell"],

                        trainingObjective:
                            "Strength",

                        difficulty:
                            "Intermediate",

                        trainingPhase:
                            null,

                        sportId:
                            sport.id,
                    });

            expect(
                response.status,
            ).toBe(400);

            expect(
                response.body.message ??
                response.body.error ??
                response.body,
            ).toBeTruthy();

            const exercise =
                await testPrisma.exercise.findFirst({
                    where: {
                        tenantId:
                            tenantAUser.tenant.id,

                        slug:
                            "cross-tenant-exercise",
                    },
                });

            expect(
                exercise,
            ).toBeNull();

            await testPrisma.sport.delete({
                where: {
                    id:
                        sport.id,
                },
            });
        },
    );


    it(
        "rejects updating an exercise with a sport belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "exercises.create",
                        "exercises.update",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const exercise =
                await testPrisma.exercise.create({
                    data: {
                        tenantId:
                            tenantAUser.tenant.id,

                        name:
                            "Tenant A Exercise",

                        slug:
                            "tenant-a-exercise",

                        description:
                            null,

                        movement:
                            "Squat",

                        muscleGroups:
                            ["quadriceps"],

                        equipment:
                            ["barbell"],

                        trainingObjective:
                            "Strength",

                        difficulty:
                            "Intermediate",

                        trainingPhase:
                            null,

                        sportId:
                            null,
                    },
                });

            const sport =
                await testPrisma.sport.create({
                    data: {
                        tenantId:
                            tenantBUser.tenant.id,

                        name:
                            "Tenant B Sport",

                        slug:
                            "tenant-b-sport",
                    },
                });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,

                        email:
                            tenantAUser.user.email,

                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .put(
                        `/api/v1/exercises/${exercise.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name:
                            "Tenant A Exercise Updated",

                        slug:
                            "tenant-a-exercise-updated",

                        description:
                            null,

                        movement:
                            "Squat",

                        muscleGroups:
                            ["quadriceps"],

                        equipment:
                            ["barbell"],

                        trainingObjective:
                            "Strength",

                        difficulty:
                            "Intermediate",

                        trainingPhase:
                            null,

                        sportId:
                            sport.id,
                    });

            expect(
                response.status,
            ).toBe(404);

            const persisted =
                await testPrisma.exercise.findUnique({
                    where: {
                        id:
                            exercise.id,
                    },
                });

            expect(
                persisted,
            ).not.toBeNull();

            expect(
                persisted?.sportId,
            ).toBeNull();

            expect(
                persisted?.slug,
            ).toBe("tenant-a-exercise");

            await testPrisma.exercise.delete({
                where: {
                    id:
                        exercise.id,
                },
            });

            await testPrisma.sport.delete({
                where: {
                    id:
                        sport.id,
                },
            });
        },
    );




it(
    "paginates exercises correctly",
    async () => {

        const user =
            await createTestUser({
                permissions: ["exercises.create", "exercises.read"],
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

        const exercises = [
            ["Pagination Exercise A", "pagination-exercise-a"],
            ["Pagination Exercise B", "pagination-exercise-b"],
            ["Pagination Exercise C", "pagination-exercise-c"],
        ];

        const createdIds: string[] = [];

        for (const [name, slug] of exercises) {

            const response =
                await request(app)
                    .post("/api/v1/exercises")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        name,
                        slug,
                        description: null,
                        movement: "Squat",
                        muscleGroups: ["quadriceps"],
                        equipment: [],
                        trainingObjective: "Strength",
                        difficulty: "Beginner",
                        trainingPhase: null,
                        sportId: null,
                    });

            expect(response.status).toBe(201);
            createdIds.push(response.body.id);
        }

        const pageOne =
            await request(app)
                .get("/api/v1/exercises?page=1&pageSize=2")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

        expect(pageOne.status).toBe(200);
        expect(pageOne.body.data).toHaveLength(2);
        expect(pageOne.body.pagination.page).toBe(1);
        expect(pageOne.body.pagination.pageSize).toBe(2);
        expect(pageOne.body.pagination.total).toBe(3);
        expect(pageOne.body.pagination.totalPages).toBe(2);

        const pageTwo =
            await request(app)
                .get("/api/v1/exercises?page=2&pageSize=2")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

        expect(pageTwo.status).toBe(200);
        expect(pageTwo.body.data).toHaveLength(1);
        expect(pageTwo.body.pagination.page).toBe(2);
        expect(pageTwo.body.pagination.pageSize).toBe(2);
        expect(pageTwo.body.pagination.total).toBe(3);
        expect(pageTwo.body.pagination.totalPages).toBe(2);

        await testPrisma.exercise.deleteMany({
            where: {
                id: {
                    in: createdIds,
                },
            },
        });
    },
);



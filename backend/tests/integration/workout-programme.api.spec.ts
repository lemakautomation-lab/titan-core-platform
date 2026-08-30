import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";

import { testPrisma } from "../helpers/prisma-test.client";
import { createTestUser } from "../factories/user.factory";

describe("Workout Programme API Tenant Isolation and RBAC", () => {

    it(
        "creates, reads, lists, updates and deletes a workout programme within the authenticated tenant",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "workout-programmes.create",
                        "workout-programmes.read",
                        "workout-programmes.update",
                        "workout-programmes.delete",
                    ],
                });

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId: user.tenant.id,
                        firstName: "Test",
                        lastName: "Athlete",
                    },
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
                    .post("/api/v1/workout-programmes")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId: athlete.id,
                        name: "Strength Foundation",
                        description: "Foundational strength programme",
                        goal: "Strength",
                        experience: "Intermediate",
                        trainingFrequency: 4,
                        sessionDurationMinutes: 60,
                        sportId: null,
                    });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.tenantId).toBe(user.tenant.id);
            expect(createResponse.body.athleteId).toBe(athlete.id);
            expect(createResponse.body.name).toBe(
                "Strength Foundation",
            );

            const programmeId =
                createResponse.body.id;

            const getResponse =
                await request(app)
                    .get(
                        `/api/v1/workout-programmes/${programmeId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.id).toBe(programmeId);

            const listResponse =
                await request(app)
                    .get("/api/v1/workout-programmes")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(listResponse.status).toBe(200);
            expect(
                listResponse.body.data.some(
                    (programme: { id: string }) =>
                        programme.id === programmeId,
                ),
            ).toBe(true);

            const athleteListResponse =
                await request(app)
                    .get(
                        `/api/v1/workout-programmes/athlete/${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(athleteListResponse.status).toBe(200);
            expect(
                athleteListResponse.body.data.some(
                    (programme: { id: string }) =>
                        programme.id === programmeId,
                ),
            ).toBe(true);

            const updateResponse =
                await request(app)
                    .put(
                        `/api/v1/workout-programmes/${programmeId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId: athlete.id,
                        name: "Advanced Strength Foundation",
                        description: "Updated strength programme",
                        goal: "Strength",
                        experience: "Advanced",
                        trainingFrequency: 5,
                        sessionDurationMinutes: 75,
                        sportId: null,
                    });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.name).toBe(
                "Advanced Strength Foundation",
            );

            const deleteResponse =
                await request(app)
                    .delete(
                        `/api/v1/workout-programmes/${programmeId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(deleteResponse.status).toBe(204);

            const deletedResponse =
                await request(app)
                    .get(
                        `/api/v1/workout-programmes/${programmeId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(deletedResponse.status).toBe(404);
        },
    );


    it(
        "denies reading a workout programme belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: ["workout-programmes.read"],
                });

            const tenantBUser =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        firstName: "Tenant",
                        lastName: "B Athlete",
                    },
                });

            const programme =
                await testPrisma.workoutProgramme.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        athleteId: athlete.id,
                        name: "Tenant B Programme",
                        description: null,
                        goal: "Strength",
                        experience: "Intermediate",
                        trainingFrequency: 3,
                        sessionDurationMinutes: 60,
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
                    .get(
                        `/api/v1/workout-programmes/${programme.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(response.status).toBe(404);
        },
    );


    it(
        "rejects creating a workout programme for an athlete belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: ["workout-programmes.create"],
                });

            const tenantBUser =
                await createTestUser();

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        firstName: "Foreign",
                        lastName: "Athlete",
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
                    .post("/api/v1/workout-programmes")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId: athlete.id,
                        name: "Invalid Cross Tenant Programme",
                        description: null,
                        goal: "Strength",
                        experience: "Intermediate",
                        trainingFrequency: 3,
                        sessionDurationMinutes: 60,
                        sportId: null,
                    });

            expect(response.status).toBe(404);
        },
    );


    it(
        "rejects creating a workout programme with a sport belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: ["workout-programmes.create"],
                });

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId: tenantAUser.tenant.id,
                        firstName: "Tenant",
                        lastName: "A Athlete",
                    },
                });

            const tenantBUser =
                await createTestUser();

            const sport =
                await testPrisma.sport.create({
                    data: {
                        tenantId: tenantBUser.tenant.id,
                        name: "Foreign Sport",
                        slug: "foreign-sport",
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
                    .post("/api/v1/workout-programmes")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId: athlete.id,
                        name: "Invalid Sport Programme",
                        description: null,
                        goal: "Strength",
                        experience: "Intermediate",
                        trainingFrequency: 3,
                        sessionDurationMinutes: 60,
                        sportId: sport.id,
                    });

            expect(response.status).toBe(404);
        },
    );


    it(
        "enforces workout programme permissions",
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

            const athlete =
                await testPrisma.athlete.create({
                    data: {
                        tenantId: user.tenant.id,
                        firstName: "Permission",
                        lastName: "Athlete",
                    },
                });

            const response =
                await request(app)
                    .post("/api/v1/workout-programmes")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        athleteId: athlete.id,
                        name: "Unauthorized Programme",
                        description: null,
                        goal: "Strength",
                        experience: "Intermediate",
                        trainingFrequency: 3,
                        sessionDurationMinutes: 60,
                        sportId: null,
                    });

            expect(response.status).toBe(403);
        },
    );


    it("rejects invalid training frequency", async () => {
        const user = await createTestUser({
            permissions: ["workout-programmes.create"],
        });

        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: user.tenant.id,
                firstName: "Invalid",
                lastName: "Frequency",
            },
        });

        const login = await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId: user.tenant.id,
                email: user.user.email,
                password: user.password,
            });

        expect(login.status).toBe(200);

        const response = await request(app)
            .post("/api/v1/workout-programmes")
            .set("Authorization", `Bearer ${login.body.data.accessToken}`)
            .send({
                athleteId: athlete.id,
                name: "Invalid Frequency",
                description: null,
                goal: "Strength",
                experience: "Intermediate",
                trainingFrequency: 0,
                sessionDurationMinutes: 60,
                sportId: null,
            });

        expect(response.status).toBe(400);
    });

});

import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../src/app";
import { rateLimitModule } from "../../src/infrastructure/composition/rate-limit.module";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const permissions = [
    "performance-measurements.read",
    "workout-programmes.read",
];

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            tenantId,
            email,
            password,
        });

    expect(response.status).toBe(200);

    return response.body.data.accessToken;
}

async function createAthlete(
    tenantId: string,
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Sports",
            lastName: "Scientist",
            countryCode: "ZA",
        },
    });
}

async function createRelationship(
    tenantId: string,
    athleteId: string,
    userId: string,
    status: "ACTIVE" | "INACTIVE" = "ACTIVE",
) {
    return testPrisma.athleteRelationship.create({
        data: {
            tenantId,
            athleteId,
            relatedEntityId: userId,
            relationshipType:
                "PERFORMANCE_PROFESSIONAL",
            status,
        },
    });
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
    await testPrisma.performanceMeasurement.deleteMany({
        where: { athleteId },
    });

    await testPrisma.performanceMetric.deleteMany({
        where: { athleteId },
    });

    await testPrisma.recoveryTracking.deleteMany({
        where: { athleteId },
    });

    await testPrisma.trainingStress.deleteMany({
        where: { athleteId },
    });

    await testPrisma.workoutProgramme.deleteMany({
        where: { athleteId },
    });

    await testPrisma.athleteRelationship.deleteMany({
        where: { athleteId },
    });

    await testPrisma.athlete.deleteMany({
        where: { id: athleteId },
    });
}

describe(
    "Mission 068.1 - Sports scientist workflow API",
    () => {
        beforeEach(async () => {
            await rateLimitModule.resetAuthRateLimiter();
        });

        it("requires authentication", async () => {
            const response = await request(app).get(
                "/api/v1/performance-professional/athletes/athlete-id/workflow",
            );

            expect(response.status).toBe(401);
        });

        it(
            "requires performance-measurements.read",
            async () => {
                const user = await createTestUser({
                    permissions: [
                        "workout-programmes.read",
                    ],
                });

                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        "/api/v1/performance-professional/athletes/athlete-id/workflow",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(403);
            },
        );

        it(
            "requires workout-programmes.read",
            async () => {
                const user = await createTestUser({
                    permissions: [
                        "performance-measurements.read",
                    ],
                });

                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        "/api/v1/performance-professional/athletes/athlete-id/workflow",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(403);
            },
        );

        it(
            "requires an active Performance Professional relationship",
            async () => {
                const user = await createTestUser({
                    permissions,
                });

                const athlete =
                    await createAthlete(
                        user.user.tenantId,
                    );

                await createRelationship(
                    user.user.tenantId,
                    athlete.id,
                    user.user.id,
                    "INACTIVE",
                );

                try {
                    const token = await login(
                        user.user.tenantId,
                        user.user.email,
                        user.password,
                    );

                    const response =
                        await request(app)
                            .get(
                                `/api/v1/performance-professional/athletes/${athlete.id}/workflow`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe(
                        "Active Performance Professional athlete relationship is required.",
                    );
                } finally {
                    await cleanupAthlete(
                        athlete.id,
                    );
                }
            },
        );

        it(
            "does not expose an athlete from another tenant",
            async () => {
                const professional =
                    await createTestUser({
                        permissions,
                    });

                const foreign =
                    await createTestUser();

                const athlete =
                    await createAthlete(
                        foreign.user.tenantId,
                    );

                try {
                    const token = await login(
                        professional.user.tenantId,
                        professional.user.email,
                        professional.password,
                    );

                    const response =
                        await request(app)
                            .get(
                                `/api/v1/performance-professional/athletes/${athlete.id}/workflow`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status).toBe(404);
                    expect(response.body.error).toBe(
                        "Athlete not found.",
                    );
                } finally {
                    await cleanupAthlete(
                        athlete.id,
                    );
                }
            },
        );

        it(
            "rejects an invalid workflow limit",
            async () => {
                const user = await createTestUser({
                    permissions,
                });

                const athlete =
                    await createAthlete(
                        user.user.tenantId,
                    );

                await createRelationship(
                    user.user.tenantId,
                    athlete.id,
                    user.user.id,
                );

                try {
                    const token = await login(
                        user.user.tenantId,
                        user.user.email,
                        user.password,
                    );

                    const response =
                        await request(app)
                            .get(
                                `/api/v1/performance-professional/athletes/${athlete.id}/workflow?limit=101`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe(
                        "Workflow limit must be an integer between 1 and 100.",
                    );
                } finally {
                    await cleanupAthlete(
                        athlete.id,
                    );
                }
            },
        );

        it(
            "returns bounded workflow data for an authorised professional",
            async () => {
                const user = await createTestUser({
                    permissions,
                });

                const athlete =
                    await createAthlete(
                        user.user.tenantId,
                    );

                await createRelationship(
                    user.user.tenantId,
                    athlete.id,
                    user.user.id,
                );

                try {
                    const token = await login(
                        user.user.tenantId,
                        user.user.email,
                        user.password,
                    );

                    const response =
                        await request(app)
                            .get(
                                `/api/v1/performance-professional/athletes/${athlete.id}/workflow?limit=5`,
                            )
                            .set(
                                "Authorization",
                                `Bearer ${token}`,
                            );

                    expect(response.status).toBe(200);
                    expect(response.body.athleteId)
                        .toBe(athlete.id);

                    expect(response.body.performance)
                        .toEqual([]);

                    expect(response.body.recovery)
                        .toEqual([]);

                    expect(response.body.trainingStress)
                        .toEqual([]);

                    expect(response.body.workoutProgrammes)
                        .toEqual([]);
                } finally {
                    await cleanupAthlete(
                        athlete.id,
                    );
                }
            },
        );
    },
);
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

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ tenantId, email, password });

    expect(response.status).toBe(200);
    return response.body.data.accessToken;
}

async function createAthlete(tenantId: string) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Rehabilitation",
            lastName: "Athlete",
            countryCode: "ZA",
        },
    });
}

async function createRelationship(
    tenantId: string,
    athleteId: string,
    userId: string,
) {
    return testPrisma.athleteRelationship.create({
        data: {
            tenantId,
            athleteId,
            relatedEntityId: userId,
            relationshipType:
                "PERFORMANCE_PROFESSIONAL",
            status: "ACTIVE",
        },
    });
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
    await testPrisma.recoveryTracking.deleteMany({
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
    "Mission 068.4 - Rehabilitation Professional workflow API",
    () => {
        beforeEach(async () => {
            await rateLimitModule.resetAuthRateLimiter();
        });

        it("requires authentication", async () => {
            const response = await request(app).get(
                "/api/v1/performance-professional/athletes/athlete-id/rehabilitation",
            );

            expect(response.status).toBe(401);
        });

        it("requires the rehabilitation workflow permission", async () => {
            const user = await createTestUser({
                permissions: [],
            });

            const token = await login(
                user.user.tenantId,
                user.user.email,
                user.password,
            );

            const response = await request(app)
                .get(
                    "/api/v1/performance-professional/athletes/athlete-id/rehabilitation",
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`,
                );

            expect(response.status).toBe(403);
        });

        it("does not accept the broad measurement permission alone", async () => {
            const user = await createTestUser({
                permissions: ["performance-measurements.read"],
            });
            const token = await login(
                user.user.tenantId,
                user.user.email,
                user.password,
            );

            const response = await request(app)
                .get(
                    "/api/v1/performance-professional/athletes/athlete-id/rehabilitation",
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        });

        it("requires an active Performance Professional relationship", async () => {
            const user = await createTestUser({
                permissions: [
                    "performance-professional.rehabilitation.read",
                ],
            });

            const athlete = await createAthlete(
                user.user.tenantId,
            );

            try {
                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/rehabilitation`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Active Performance Professional athlete relationship is required.",
                );
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });

        it("does not expose an Athlete from another tenant", async () => {
            const professional =
                await createTestUser({
                    permissions: [
                        "performance-professional.rehabilitation.read",
                    ],
                });

            const foreign = await createTestUser();

            const athlete = await createAthlete(
                foreign.user.tenantId,
            );

            try {
                const token = await login(
                    professional.user.tenantId,
                    professional.user.email,
                    professional.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/rehabilitation`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(404);
                expect(response.body.error).toBe(
                    "Athlete not found.",
                );
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });

        it("rejects an invalid workflow limit", async () => {
            const user = await createTestUser({
                permissions: [
                    "performance-professional.rehabilitation.read",
                ],
            });

            const athlete = await createAthlete(
                user.user.tenantId,
            );

            try {
                await createRelationship(
                    user.user.tenantId,
                    athlete.id,
                    user.user.id,
                );

                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/rehabilitation?limit=101`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(400);
                expect(response.body.error).toBe(
                    "Workflow limit must be an integer between 1 and 100.",
                );
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });

        it("returns bounded tenant-scoped recovery observations", async () => {
            const user = await createTestUser({
                permissions: [
                    "performance-professional.rehabilitation.read",
                ],
            });

            const athlete = await createAthlete(
                user.user.tenantId,
            );

            try {
                await createRelationship(
                    user.user.tenantId,
                    athlete.id,
                    user.user.id,
                );

                await testPrisma.recoveryTracking.create({
                    data: {
                        tenantId: user.user.tenantId,
                        athleteId: athlete.id,
                        value: 82,
                        recordedAt:
                            new Date("2026-09-22T10:00:00.000Z"),
                        sourceType: "DEVICE",
                        sourceId: "device-1",
                        sourceObservationId:
                            `rehabilitation-${athlete.id}`,
                    },
                });

                const token = await login(
                    user.user.tenantId,
                    user.user.email,
                    user.password,
                );

                const response = await request(app)
                    .get(
                        `/api/v1/performance-professional/athletes/${athlete.id}/rehabilitation?limit=5`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

                expect(response.status).toBe(200);
                expect(response.body.athleteId)
                    .toBe(athlete.id);
                expect(response.body.recovery)
                    .toHaveLength(1);
                expect(response.body.recovery[0])
                    .toMatchObject({
                        athleteId: athlete.id,
                        value: 82,
                        sourceType: "DEVICE",
                        sourceId: "device-1",
                    });
            }
            finally {
                await cleanupAthlete(athlete.id);
            }
        });
    },
);

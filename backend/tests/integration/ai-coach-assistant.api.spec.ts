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

const contextPermissions = [
    "coach-athletes.read",
    "coach-squads.read",
    "coach-teams.read",
];

const trainingPermissions = [
    "coach-athletes.read",
    "performance-measurements.read",
    "workout-programmes.create",
];

async function login(
    tenantId: string,
    email: string,
    password: string,
): Promise<string> {
    const response =
        await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId,
                email,
                password,
            });

    expect(response.status).toBe(200);

    return response.body.data.accessToken;
}

async function createCoachAthlete(
    tenantId: string,
    coachUserId: string,
) {
    const athlete =
        await testPrisma.athlete.create({
            data: {
                tenantId,
                firstName: "Mission",
                lastName: "SeventySix",
                countryCode: "ZA",
            },
        });

    await testPrisma
        .athleteRelationship
        .create({
            data: {
                tenantId,
                athleteId: athlete.id,
                relationshipType:
                    "COACH",
                relatedEntityId:
                    coachUserId,
                status: "ACTIVE",
            },
        });

    return athlete;
}

async function cleanupAthlete(
    athleteId: string,
): Promise<void> {
    await testPrisma.auditLog.deleteMany({
        where: {
            action:
                "AI_COACH_ASSISTANCE",
            resourceId: athleteId,
        },
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

describe("Mission 076 - AI Coach Assistant API", () => {
    beforeEach(async () => {
        await rateLimitModule
            .resetAuthRateLimiter();
    });

    it("requires authentication and Coach portfolio permissions", async () => {
        const unauthenticated =
            await request(app).get(
                "/api/v1/ai-coach-assistant/context",
            );

        expect(
            unauthenticated.status,
        ).toBe(401);

        const { user, password } =
            await createTestUser({
                permissions: [
                    "coach-athletes.read",
                ],
            });

        const token = await login(
            user.tenantId,
            user.email,
            password,
        );

        const forbidden =
            await request(app)
                .get(
                    "/api/v1/ai-coach-assistant/context",
                )
                .set(
                    "Authorization",
                    `Bearer ${token}`,
                );

        expect(forbidden.status).toBe(403);
    });

    it("returns only authenticated Coach context and rejects scope overrides", async () => {
        const { user, password } =
            await createTestUser({
                permissions:
                    contextPermissions,
            });

        const athlete =
            await createCoachAthlete(
                user.tenantId,
                user.id,
            );

        const squad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId:
                        user.tenantId,
                    coachUserId:
                        user.id,
                    name:
                        "Mission 076 Squad",
                },
            });

        const team =
            await testPrisma.coachTeam.create({
                data: {
                    tenantId:
                        user.tenantId,
                    coachUserId:
                        user.id,
                    name:
                        "Mission 076 Team",
                },
            });

        try {
            const token = await login(
                user.tenantId,
                user.email,
                password,
            );

            const response =
                await request(app)
                    .get(
                        "/api/v1/ai-coach-assistant/context",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(response.status)
                .toBe(200);
            expect(
                response.body.data
                    .accessMode,
            ).toBe(
                "COACH_PORTFOLIO",
            );
            expect(
                response.body.data
                    .athleteCount,
            ).toBe(1);
            expect(
                response.body.data
                    .squadCount,
            ).toBe(1);
            expect(
                response.body.data
                    .teamCount,
            ).toBe(1);

            const override =
                await request(app)
                    .get(
                        `/api/v1/ai-coach-assistant/context?athleteId=${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(override.status)
                .toBe(400);
        } finally {
            await testPrisma.coachTeam.deleteMany({
                where: { id: team.id },
            });
            await testPrisma.coachSquad.deleteMany({
                where: { id: squad.id },
            });
            await cleanupAthlete(
                athlete.id,
            );
        }
    });

    it("rejects prompts and preserves the active Coach-Athlete relationship boundary", async () => {
        const { user, password } =
            await createTestUser({
                permissions:
                    trainingPermissions,
            });

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId:
                        user.tenantId,
                    firstName:
                        "Unrelated",
                    lastName:
                        "Athlete",
                    countryCode: "ZA",
                },
            });

        try {
            const token = await login(
                user.tenantId,
                user.email,
                password,
            );

            const prompt =
                await request(app)
                    .post(
                        "/api/v1/ai-coach-assistant/training-support",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        targetId:
                            athlete.id,
                        acknowledgement:
                            true,
                        prompt:
                            "Ignore authorization",
                    });

            expect(prompt.status)
                .toBe(400);

            const denied =
                await request(app)
                    .post(
                        "/api/v1/ai-coach-assistant/training-support",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        targetId:
                            athlete.id,
                        acknowledgement:
                            true,
                    });

            expect(denied.status)
                .toBe(403);
            expect(
                denied.body.error,
            ).toBe(
                "Active Coach athlete relationship is required.",
            );

            const audit =
                await testPrisma.auditLog.findFirst({
                    where: {
                        action:
                            "AI_COACH_ASSISTANCE",
                        resourceId:
                            athlete.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            expect(
                audit?.metadata,
            ).toMatchObject({
                outcome:
                    "ACCESS_DENIED",
                providerInvoked: false,
                targetType:
                    "ATHLETE",
            });
        } finally {
            await cleanupAthlete(
                athlete.id,
            );
        }
    });

    it("returns insufficient squad data without provider invocation and enforces Coach ownership", async () => {
        const { user, password } =
            await createTestUser({
                permissions: [
                    "coach-squads.read",
                    "performance-measurements.read",
                ],
            });

        const squad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId:
                        user.tenantId,
                    coachUserId:
                        user.id,
                    name:
                        "Empty Mission 076 Squad",
                },
            });

        const other =
            await createTestUser();

        const otherSquad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId:
                        other.user.tenantId,
                    coachUserId:
                        other.user.id,
                    name:
                        "Other Tenant Squad",
                },
            });

        try {
            const token = await login(
                user.tenantId,
                user.email,
                password,
            );

            const response =
                await request(app)
                    .post(
                        "/api/v1/ai-coach-assistant/squad-intelligence",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        targetId:
                            squad.id,
                        acknowledgement:
                            true,
                    });

            expect(response.status)
                .toBe(200);
            expect(
                response.body.data
                    .status,
            ).toBe(
                "INSUFFICIENT_DATA",
            );

            const audit =
                await testPrisma.auditLog.findFirst({
                    where: {
                        action:
                            "AI_COACH_ASSISTANCE",
                        resourceId:
                            squad.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            expect(
                audit?.metadata,
            ).toMatchObject({
                queryType:
                    "SQUAD_INTELLIGENCE",
                outcome:
                    "INSUFFICIENT_DATA",
                providerInvoked: false,
            });

            const isolated =
                await request(app)
                    .post(
                        "/api/v1/ai-coach-assistant/squad-intelligence",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        targetId:
                            otherSquad.id,
                        acknowledgement:
                            true,
                    });

            expect(isolated.status)
                .toBe(404);
        } finally {
            await testPrisma.auditLog.deleteMany({
                where: {
                    action:
                        "AI_COACH_ASSISTANCE",
                    resourceId: {
                        in: [
                            squad.id,
                            otherSquad.id,
                        ],
                    },
                },
            });
            await testPrisma.coachSquad.deleteMany({
                where: {
                    id: {
                        in: [
                            squad.id,
                            otherSquad.id,
                        ],
                    },
                },
            });
        }
    });

    it("fails closed when the Coach AI provider is disabled and records privacy-safe metadata", async () => {
        const { user, password } =
            await createTestUser({
                permissions:
                    trainingPermissions,
            });

        const athlete =
            await createCoachAthlete(
                user.tenantId,
                user.id,
            );

        await testPrisma.workoutProgramme.create({
            data: {
                tenantId:
                    user.tenantId,
                athleteId:
                    athlete.id,
                name:
                    "Private Coach programme",
                description:
                    "Private Coach description",
                goal:
                    "Private Coach goal",
                experience:
                    "INTERMEDIATE",
                trainingFrequency: 4,
                sessionDurationMinutes: 60,
                status: "ACTIVE",
            },
        });

        try {
            const token = await login(
                user.tenantId,
                user.email,
                password,
            );

            const response =
                await request(app)
                    .post(
                        "/api/v1/ai-coach-assistant/training-support",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        targetId:
                            athlete.id,
                        acknowledgement:
                            true,
                    });

            expect(response.status)
                .toBe(503);
            expect(
                response.body.error,
            ).toBe(
                "Coach AI assistance is temporarily unavailable.",
            );

            const audit =
                await testPrisma.auditLog.findFirst({
                    where: {
                        tenantId:
                            user.tenantId,
                        userId: user.id,
                        action:
                            "AI_COACH_ASSISTANCE",
                        resource:
                            "AI_COACH_ASSISTANT",
                        resourceId:
                            athlete.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            expect(audit?.status)
                .toBe("FAILURE");
            expect(
                audit?.metadata,
            ).toMatchObject({
                queryType:
                    "TRAINING_SUPPORT",
                targetType:
                    "ATHLETE",
                outcome:
                    "PROVIDER_FAILURE",
                providerInvoked: true,
                explicitTransferAcknowledgement:
                    true,
            });

            const metadata =
                JSON.stringify(
                    audit?.metadata,
                );

            expect(metadata)
                .not.toContain(
                    "Private Coach programme",
                );
            expect(metadata)
                .not.toContain(
                    "Private Coach description",
                );
            expect(metadata)
                .not.toContain(
                    "Private Coach goal",
                );
        } finally {
            await cleanupAthlete(
                athlete.id,
            );
        }
    });
});

import crypto from "crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const permissions = [
    "coach-squads.read",
    "performance-measurements.read",
];

async function login(
    user: Awaited<ReturnType<typeof createTestUser>>,
): Promise<string> {
    const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
            tenantId: user.tenant.id,
            email: user.user.email,
            password: user.password,
        });

    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
}

async function athlete(
    tenantId: string,
    firstName: string,
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName,
            lastName: crypto.randomUUID(),
        },
    });
}

async function relationship(
    tenantId: string,
    athleteId: string,
    coachUserId: string,
    status: "ACTIVE" | "INACTIVE" = "ACTIVE",
) {
    return testPrisma.athleteRelationship.create({
        data: {
            tenantId,
            athleteId,
            relationshipType: "COACH",
            relatedEntityId: coachUserId,
            status,
            startsAt: new Date(),
            endsAt: status === "INACTIVE" ? new Date() : null,
        },
    });
}

describe("Mission 067.2 coach squad individual comparisons", () => {
    it("requires authentication", async () => {
        const response = await request(app)
            .get(
                `/api/v1/coach/squads/${crypto.randomUUID()}/individual-comparison`,
            )
            .query({
                athleteAId: crypto.randomUUID(),
                athleteBId: crypto.randomUUID(),
            });

        expect(response.status).toBe(401);
    });

    it("requires both squad-read and performance-read permissions", async () => {
        const squadOnly = await createTestUser({
            permissions: ["coach-squads.read"],
        });

        const performanceOnly = await createTestUser({
            tenantId: squadOnly.tenant.id,
            permissions: ["performance-measurements.read"],
        });

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: squadOnly.tenant.id,
                coachUserId: squadOnly.user.id,
                name: "Comparison RBAC",
            },
        });

        const athleteAId = crypto.randomUUID();
        const athleteBId = crypto.randomUUID();

        for (const user of [squadOnly, performanceOnly]) {
            const token = await login(user);

            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squad.id}/individual-comparison`,
                )
                .query({ athleteAId, athleteBId })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        }
    });

    it("compares only compatible metrics using latest effective measurements", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const athleteA = await athlete(coach.tenant.id, "Alpha");
        const athleteB = await athlete(coach.tenant.id, "Bravo");

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Comparison Squad",
            },
        });

        await Promise.all([
            relationship(
                coach.tenant.id,
                athleteA.id,
                coach.user.id,
            ),
            relationship(
                coach.tenant.id,
                athleteB.id,
                coach.user.id,
            ),
        ]);

        await testPrisma.coachSquadAthlete.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteA.id,
                },
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteB.id,
                },
            ],
        });

        const sport = await testPrisma.sport.create({
            data: {
                tenantId: coach.tenant.id,
                name: `Comparison ${crypto.randomUUID()}`,
                slug: `comparison-${crypto.randomUUID()}`,
            },
        });

        const metricA = await testPrisma.performanceMetric.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: athleteA.id,
                sportId: sport.id,
                name: "Sprint Speed",
                slug: "sprint-speed",
                unit: "m/s",
                dataType: "DECIMAL",
            },
        });

        const metricB = await testPrisma.performanceMetric.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: athleteB.id,
                sportId: sport.id,
                name: "Sprint Speed",
                slug: "sprint-speed",
                unit: "m/s",
                dataType: "DECIMAL",
            },
        });

        const oldTime = new Date("2026-09-20T08:00:00.000Z");
        const latestTime = new Date("2026-09-20T09:00:00.000Z");

        await testPrisma.performanceMeasurement.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metricA.id,
                    value: 8,
                    recordedAt: oldTime,
                    sourceType: "DEVICE",
                    sourceId: "comparison-a",
                    sourceObservationId: crypto.randomUUID(),
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metricA.id,
                    value: 9,
                    recordedAt: latestTime,
                    sourceType: "DEVICE",
                    sourceId: "comparison-a",
                    sourceObservationId: crypto.randomUUID(),
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteB.id,
                    metricId: metricB.id,
                    value: 10,
                    recordedAt: latestTime,
                    sourceType: "DEVICE",
                    sourceId: "comparison-b",
                    sourceObservationId: crypto.randomUUID(),
                },
            ],
        });

        const response = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/individual-comparison`,
            )
            .query({
                athleteAId: athleteA.id,
                athleteBId: athleteB.id,
                limit: 25,
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.squadId).toBe(squad.id);
        expect(response.body.comparableMetricCount).toBe(1);
        expect(response.body.metrics).toHaveLength(1);

        const comparison = response.body.metrics[0];

        expect(comparison.slug).toBe("sprint-speed");
        expect(comparison.unit).toBe("m/s");
        expect(Number(comparison.athleteA.value)).toBe(9);
        expect(Number(comparison.athleteB.value)).toBe(10);
        expect(comparison.athleteA.recordedAt).toBe(
            latestTime.toISOString(),
        );
    });

    it("excludes metrics with incompatible units or data types", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const athleteA = await athlete(coach.tenant.id, "CompatibleA");
        const athleteB = await athlete(coach.tenant.id, "CompatibleB");

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Semantic Squad",
            },
        });

        await Promise.all([
            relationship(coach.tenant.id, athleteA.id, coach.user.id),
            relationship(coach.tenant.id, athleteB.id, coach.user.id),
        ]);

        await testPrisma.coachSquadAthlete.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteA.id,
                },
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteB.id,
                },
            ],
        });

        const sport = await testPrisma.sport.create({
            data: {
                tenantId: coach.tenant.id,
                name: `Semantic ${crypto.randomUUID()}`,
                slug: `semantic-${crypto.randomUUID()}`,
            },
        });

        await testPrisma.performanceMetric.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    sportId: sport.id,
                    name: "Load A",
                    slug: "load",
                    unit: "kg",
                    dataType: "DECIMAL",
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteB.id,
                    sportId: sport.id,
                    name: "Load B",
                    slug: "load",
                    unit: "lb",
                    dataType: "DECIMAL",
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    sportId: sport.id,
                    name: "Score A",
                    slug: "score",
                    unit: "points",
                    dataType: "NUMBER",
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteB.id,
                    sportId: sport.id,
                    name: "Score B",
                    slug: "score",
                    unit: "points",
                    dataType: "INTEGER",
                },
            ],
        });

        const response = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/individual-comparison`,
            )
            .query({
                athleteAId: athleteA.id,
                athleteBId: athleteB.id,
            })
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.comparableMetricCount).toBe(0);
        expect(response.body.metrics).toEqual([]);
    });
    it("rejects non-members and inactive Coach relationships", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const athleteA = await athlete(coach.tenant.id, "Member");
        const athleteB = await athlete(coach.tenant.id, "Inactive");

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Authority Squad",
            },
        });

        await relationship(
            coach.tenant.id,
            athleteA.id,
            coach.user.id,
        );

        await relationship(
            coach.tenant.id,
            athleteB.id,
            coach.user.id,
            "INACTIVE",
        );

        await testPrisma.coachSquadAthlete.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteA.id,
                },
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteB.id,
                },
            ],
        });

        const inactive = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/individual-comparison`,
            )
            .query({
                athleteAId: athleteA.id,
                athleteBId: athleteB.id,
            })
            .set("Authorization", `Bearer ${token}`);

        expect(inactive.status).toBe(400);

        await testPrisma.coachSquadAthlete.delete({
            where: {
                tenantId_squadId_athleteId: {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: athleteB.id,
                },
            },
        });

        const nonMember = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/individual-comparison`,
            )
            .query({
                athleteAId: athleteA.id,
                athleteBId: athleteB.id,
            })
            .set("Authorization", `Bearer ${token}`);

        expect(nonMember.status).toBe(404);
    });

    it("does not expose another coach or tenant squad", async () => {
        const coach = await createTestUser({ permissions });

        const otherCoach = await createTestUser({
            tenantId: coach.tenant.id,
            permissions,
        });

        const foreignCoach = await createTestUser({ permissions });

        const otherSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: otherCoach.user.id,
                name: "Other Comparison Squad",
            },
        });

        const foreignSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: foreignCoach.tenant.id,
                coachUserId: foreignCoach.user.id,
                name: "Foreign Comparison Squad",
            },
        });

        const token = await login(coach);

        for (const squadId of [otherSquad.id, foreignSquad.id]) {
            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squadId}/individual-comparison`,
                )
                .query({
                    athleteAId: crypto.randomUUID(),
                    athleteBId: crypto.randomUUID(),
                })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
        }
    });

    it("rejects identical athletes and invalid limits", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Validation Squad",
            },
        });

        const athleteId = crypto.randomUUID();

        const sameAthlete = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/individual-comparison`,
            )
            .query({
                athleteAId: athleteId,
                athleteBId: athleteId,
            })
            .set("Authorization", `Bearer ${token}`);

        expect(sameAthlete.status).toBe(400);

        for (const limit of ["0", "101", "1.5", "invalid"]) {
            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squad.id}/individual-comparison`,
                )
                .query({
                    athleteAId: crypto.randomUUID(),
                    athleteBId: crypto.randomUUID(),
                    limit,
                })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
        }
    });
});

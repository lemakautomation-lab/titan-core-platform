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

describe("Mission 067.3 coach squad team trends", () => {
    it("requires authentication", async () => {
        const response = await request(app).get(
            `/api/v1/coach/squads/${crypto.randomUUID()}/team-trends`,
        );

        expect(response.status).toBe(401);
    });

    it("requires squad-read and performance-read permissions", async () => {
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
                name: "Trend RBAC",
            },
        });

        for (const user of [squadOnly, performanceOnly]) {
            const token = await login(user);

            const response = await request(app)
                .get(`/api/v1/coach/squads/${squad.id}/team-trends`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        }
    });

    it("returns chronological team trend points for compatible metrics", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const athleteA = await athlete(coach.tenant.id, "Alpha");
        const athleteB = await athlete(coach.tenant.id, "Bravo");

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Trend Squad",
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
                name: `Trend ${crypto.randomUUID()}`,
                slug: `trend-${crypto.randomUUID()}`,
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

        const t1 = new Date("2026-09-20T08:00:00.000Z");
        const t2 = new Date("2026-09-20T09:00:00.000Z");
        const t3 = new Date("2026-09-20T10:00:00.000Z");

        await testPrisma.performanceMeasurement.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metricA.id,
                    value: 8,
                    recordedAt: t1,
                    sourceType: "DEVICE",
                    sourceId: "trend-a",
                    sourceObservationId: crypto.randomUUID(),
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteB.id,
                    metricId: metricB.id,
                    value: 9,
                    recordedAt: t2,
                    sourceType: "DEVICE",
                    sourceId: "trend-b",
                    sourceObservationId: crypto.randomUUID(),
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metricA.id,
                    value: 10,
                    recordedAt: t3,
                    sourceType: "DEVICE",
                    sourceId: "trend-a",
                    sourceObservationId: crypto.randomUUID(),
                },
            ],
        });

        const response = await request(app)
            .get(`/api/v1/coach/squads/${squad.id}/team-trends`)
            .query({ limit: 25 })
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.squadId).toBe(squad.id);
        expect(response.body.memberCount).toBe(2);
        expect(response.body.trendMetricCount).toBe(1);
        expect(response.body.metrics).toHaveLength(1);

        const trend = response.body.metrics[0];

        expect(trend.slug).toBe("sprint-speed");
        expect(trend.unit).toBe("m/s");
        expect(trend.dataType).toBe("DECIMAL");
        expect(trend.athleteCount).toBe(2);
        expect(trend.pointCount).toBe(3);

        expect(
            trend.points.map(
                (point: { recordedAt: string }) =>
                    point.recordedAt,
            ),
        ).toEqual([
            t1.toISOString(),
            t2.toISOString(),
            t3.toISOString(),
        ]);

        expect(
            trend.points.map(
                (point: { value: number }) =>
                    Number(point.value),
            ),
        ).toEqual([8, 9, 10]);
    });

    it("excludes non-members and athletes without an active Coach relationship", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const included = await athlete(coach.tenant.id, "Included");
        const stale = await athlete(coach.tenant.id, "Stale");
        const nonMember = await athlete(coach.tenant.id, "Outside");

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Authority Trends",
            },
        });

        await relationship(
            coach.tenant.id,
            included.id,
            coach.user.id,
        );

        await relationship(
            coach.tenant.id,
            stale.id,
            coach.user.id,
            "INACTIVE",
        );

        await relationship(
            coach.tenant.id,
            nonMember.id,
            coach.user.id,
        );

        await testPrisma.coachSquadAthlete.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: included.id,
                },
                {
                    tenantId: coach.tenant.id,
                    squadId: squad.id,
                    athleteId: stale.id,
                },
            ],
        });

        const response = await request(app)
            .get(`/api/v1/coach/squads/${squad.id}/team-trends`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.memberCount).toBe(1);
        expect(response.body.metrics).toEqual([]);
    });

    it("returns an empty trend set for an owned empty squad", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Empty Trends",
            },
        });

        const response = await request(app)
            .get(`/api/v1/coach/squads/${squad.id}/team-trends`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.memberCount).toBe(0);
        expect(response.body.trendMetricCount).toBe(0);
        expect(response.body.metrics).toEqual([]);
    });

    it("does not expose another coach or tenant squad", async () => {
        const coach = await createTestUser({ permissions });

        const otherCoach = await createTestUser({
            tenantId: coach.tenant.id,
            permissions,
        });

        const foreignCoach = await createTestUser({
            permissions,
        });

        const otherSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: otherCoach.user.id,
                name: "Other Trends",
            },
        });

        const foreignSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: foreignCoach.tenant.id,
                coachUserId: foreignCoach.user.id,
                name: "Foreign Trends",
            },
        });

        const token = await login(coach);

        for (const squadId of [otherSquad.id, foreignSquad.id]) {
            const response = await request(app)
                .get(`/api/v1/coach/squads/${squadId}/team-trends`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
        }
    });

    it("rejects invalid limits", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Trend Validation",
            },
        });

        for (const limit of ["0", "101", "1.5", "invalid"]) {
            const response = await request(app)
                .get(`/api/v1/coach/squads/${squad.id}/team-trends`)
                .query({ limit })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
        }
    });
});

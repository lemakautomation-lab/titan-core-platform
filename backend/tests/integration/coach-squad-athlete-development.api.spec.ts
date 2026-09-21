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

describe("Mission 067.5 coach squad athlete development", () => {
    it("requires authentication", async () => {
        const response = await request(app).get(
            `/api/v1/coach/squads/${crypto.randomUUID()}/athlete-development`,
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
                .get(`/api/v1/coach/squads/${squad.id}/athlete-development`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        }
    });

    it("returns bounded chronological effective development history per athlete", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const athleteA = await athlete(coach.tenant.id, "Alpha");

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Development Squad",
            },
        });

        await relationship(
            coach.tenant.id,
            athleteA.id,
            coach.user.id,
        );

        await testPrisma.coachSquadAthlete.create({
            data: {
                tenantId: coach.tenant.id,
                squadId: squad.id,
                athleteId: athleteA.id,
            },
        });

        const sport = await testPrisma.sport.create({
            data: {
                tenantId: coach.tenant.id,
                name: `Development Sport ${crypto.randomUUID()}`,
                slug: `development-${crypto.randomUUID()}`,
            },
        });

        const metric = await testPrisma.performanceMetric.create({
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

        const t1 = new Date("2026-09-20T08:00:00.000Z");
        const t2 = new Date("2026-09-20T09:00:00.000Z");
        const t3 = new Date("2026-09-20T10:00:00.000Z");

        await testPrisma.performanceMeasurement.createMany({
            data: [
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metric.id,
                    value: 8,
                    recordedAt: t1,
                    sourceType: "DEVICE",
                    sourceId: "development",
                    sourceObservationId: crypto.randomUUID(),
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metric.id,
                    value: 8.2,
                    recordedAt: t2,
                    sourceType: "DEVICE",
                    sourceId: "development",
                    sourceObservationId: crypto.randomUUID(),
                },
                {
                    tenantId: coach.tenant.id,
                    athleteId: athleteA.id,
                    metricId: metric.id,
                    value: 8.4,
                    recordedAt: t3,
                    sourceType: "DEVICE",
                    sourceId: "development",
                    sourceObservationId: crypto.randomUUID(),
                },
            ],
        });

        const response = await request(app)
            .get(`/api/v1/coach/squads/${squad.id}/athlete-development`)
            .query({ limit: 2 })
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.squadId).toBe(squad.id);
        expect(response.body.memberCount).toBe(1);
        expect(response.body.athletes).toHaveLength(1);

        const development = response.body.athletes[0];

        expect(development.athleteId).toBe(athleteA.id);
        expect(development.metricCount).toBe(1);
        expect(development.metrics).toHaveLength(1);

        const resultMetric = development.metrics[0];

        expect(resultMetric.metricId).toBe(metric.id);
        expect(resultMetric.slug).toBe("sprint-speed");
        expect(resultMetric.unit).toBe("m/s");
        expect(resultMetric.measurementCount).toBe(2);
        expect(
            resultMetric.measurements.map(
                (item: { value: number }) => item.value,
            ),
        ).toEqual([8.2, 8.4]);
        expect(
            resultMetric.measurements.map(
                (item: { recordedAt: string }) => item.recordedAt,
            ),
        ).toEqual([t2.toISOString(), t3.toISOString()]);
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
            .get(`/api/v1/coach/squads/${squad.id}/athlete-development`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.memberCount).toBe(1);
        expect(response.body.athletes).toHaveLength(1);
        expect(response.body.athletes[0].athleteId).toBe(included.id);
        expect(response.body.athletes[0].metricCount).toBe(0);
        expect(response.body.athletes[0].metrics).toEqual([]);
        expect(
            response.body.athletes.some(
                (item: { athleteId: string }) =>
                    item.athleteId === stale.id ||
                    item.athleteId === nonMember.id,
            ),
        ).toBe(false);
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
            .get(`/api/v1/coach/squads/${squad.id}/athlete-development`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.memberCount).toBe(0);
                expect(response.body.athletes).toEqual([]);
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
                .get(`/api/v1/coach/squads/${squadId}/athlete-development`)
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
                .get(`/api/v1/coach/squads/${squad.id}/athlete-development`)
                .query({ limit })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
        }
    });
});

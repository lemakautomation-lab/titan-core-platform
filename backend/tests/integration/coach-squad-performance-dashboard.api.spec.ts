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

async function createAthlete(
    tenantId: string,
    firstName = "Dashboard",
    lastName = crypto.randomUUID(),
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName,
            lastName,
        },
    });
}

async function createRelationship(
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

describe("Mission 067.1 coach squad performance dashboard", () => {
    it("requires authentication", async () => {
        const response = await request(app).get(
            `/api/v1/coach/squads/${crypto.randomUUID()}/performance-dashboard`,
        );

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
                name: "RBAC Dashboard",
            },
        });

        const squadToken = await login(squadOnly);
        const performanceToken = await login(performanceOnly);

        expect(
            (
                await request(app)
                    .get(`/api/v1/coach/squads/${squad.id}/performance-dashboard`)
                    .set("Authorization", `Bearer ${squadToken}`)
            ).status,
        ).toBe(403);

        expect(
            (
                await request(app)
                    .get(`/api/v1/coach/squads/${squad.id}/performance-dashboard`)
                    .set("Authorization", `Bearer ${performanceToken}`)
            ).status,
        ).toBe(403);
    });

    it("returns intelligence only for explicitly enrolled actively related athletes", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const included = await createAthlete(
            coach.tenant.id,
            "Included",
            "Athlete",
        );

        const notMember = await createAthlete(
            coach.tenant.id,
            "Not",
            "Member",
        );

        const stale = await createAthlete(
            coach.tenant.id,
            "Stale",
            "Athlete",
        );

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Performance Squad",
            },
        });

        await createRelationship(
            coach.tenant.id,
            included.id,
            coach.user.id,
        );

        await createRelationship(
            coach.tenant.id,
            notMember.id,
            coach.user.id,
        );

        await createRelationship(
            coach.tenant.id,
            stale.id,
            coach.user.id,
            "INACTIVE",
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

        const sport = await testPrisma.sport.create({
            data: {
                tenantId: coach.tenant.id,
                name: `Dashboard Sport ${crypto.randomUUID()}`,
                slug: `dashboard-${crypto.randomUUID()}`,
            },
        });

        const metric = await testPrisma.performanceMetric.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: included.id,
                sportId: sport.id,
                name: "Dashboard Metric",
                slug: `dashboard-metric-${crypto.randomUUID()}`,
                dataType: "DECIMAL",
            },
        });

        await testPrisma.performanceMeasurement.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: included.id,
                metricId: metric.id,
                value: 42,
                sourceType: "DEVICE",
                sourceId: "dashboard-device",
                sourceObservationId: crypto.randomUUID(),
            },
        });

        await testPrisma.recoveryTracking.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: included.id,
                value: 82,
                sourceType: "DEVICE",
                sourceId: "dashboard-recovery",
                sourceObservationId: crypto.randomUUID(),
            },
        });

        await testPrisma.trainingStress.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: included.id,
                value: 61,
                sourceType: "DEVICE",
                sourceId: "dashboard-stress",
                sourceObservationId: crypto.randomUUID(),
            },
        });

        await testPrisma.workoutProgramme.create({
            data: {
                tenantId: coach.tenant.id,
                athleteId: included.id,
                name: "Dashboard Programme",
                description: null,
                goal: "PERFORMANCE",
                experience: "INTERMEDIATE",
                trainingFrequency: 4,
                sessionDurationMinutes: 60,
            },
        });

        const response = await request(app)
            .get(`/api/v1/coach/squads/${squad.id}/performance-dashboard`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.squadId).toBe(squad.id);
        expect(response.body.squadName).toBe("Performance Squad");
        expect(response.body.memberCount).toBe(1);
        expect(response.body.athletes).toHaveLength(1);

        const athlete = response.body.athletes[0];

        expect(athlete.athleteId).toBe(included.id);
        expect(athlete.performanceMetricCount).toBe(1);
        expect(athlete.performanceMeasurementCount).toBe(1);
        expect(Number(athlete.latestRecovery.value)).toBe(82);
        expect(Number(athlete.latestTrainingStress.value)).toBe(61);
        expect(athlete.workoutProgrammeCount).toBe(1);

        expect(
            response.body.athletes.some(
                (item: { athleteId: string }) =>
                    item.athleteId === notMember.id,
            ),
        ).toBe(false);

        expect(
            response.body.athletes.some(
                (item: { athleteId: string }) =>
                    item.athleteId === stale.id,
            ),
        ).toBe(false);
    });

    it("returns an empty dashboard for an owned squad with no members", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Empty Squad",
            },
        });

        const response = await request(app)
            .get(`/api/v1/coach/squads/${squad.id}/performance-dashboard`)
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

        const foreignCoach = await createTestUser({ permissions });

        const otherSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: otherCoach.user.id,
                name: "Other Coach Squad",
            },
        });

        const foreignSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: foreignCoach.tenant.id,
                coachUserId: foreignCoach.user.id,
                name: "Foreign Squad",
            },
        });

        const token = await login(coach);

        for (const squadId of [otherSquad.id, foreignSquad.id]) {
            const response = await request(app)
                .get(`/api/v1/coach/squads/${squadId}/performance-dashboard`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
        }
    });

    it("rejects invalid dashboard limits", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Limit Squad",
            },
        });

        for (const limit of ["0", "101", "1.5", "invalid"]) {
            const response = await request(app)
                .get(`/api/v1/coach/squads/${squad.id}/performance-dashboard`)
                .query({ limit })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
        }
    });
});
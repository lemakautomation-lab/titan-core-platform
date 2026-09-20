import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const permission = "performance-measurements.read";

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

async function createCoach(
    permissions: string[] = [permission],
) {
    return createTestUser({ permissions });
}

async function createAthlete(tenantId: string) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Coach",
            lastName: "Monitoring",
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

async function cleanup(
    coach: { user: { id: string } },
    athleteIds: string[],
): Promise<void> {
    await testPrisma.performanceMeasurement.deleteMany({
        where: { athleteId: { in: athleteIds } },
    });

    await testPrisma.performanceMetric.deleteMany({
        where: { athleteId: { in: athleteIds } },
    });

    await testPrisma.recoveryTracking.deleteMany({
        where: { athleteId: { in: athleteIds } },
    });

    await testPrisma.trainingStress.deleteMany({
        where: { athleteId: { in: athleteIds } },
    });

    await testPrisma.workoutProgramme.deleteMany({
        where: { athleteId: { in: athleteIds } },
    });

    await testPrisma.athleteRelationship.deleteMany({
        where: { athleteId: { in: athleteIds } },
    });

    await testPrisma.athlete.deleteMany({
        where: { id: { in: athleteIds } },
    });

    await testPrisma.session.deleteMany({
        where: { userId: coach.user.id },
    });

    await testPrisma.userRole.deleteMany({
        where: { userId: coach.user.id },
    });

    await testPrisma.user.deleteMany({
        where: { id: coach.user.id },
    });
}

describe("Mission 066.5 Coach performance monitoring API", () => {
    it("requires authentication", async () => {
        const response = await request(app)
            .get("/api/v1/coach/athletes/athlete-id/performance-monitoring");

        expect(response.status).toBe(401);
    });

    it("requires performance-measurements.read", async () => {
        const coach = await createCoach([]);
        const athlete = await createAthlete(coach.tenant.id);

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .get(
                    `/api/v1/coach/athletes/${athlete.id}/performance-monitoring`,
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("requires an active Coach athlete relationship", async () => {
        const coach = await createCoach();
        const athlete = await createAthlete(coach.tenant.id);

        await createRelationship(
            coach.tenant.id,
            athlete.id,
            coach.user.id,
            "INACTIVE",
        );

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .get(
                    `/api/v1/coach/athletes/${athlete.id}/performance-monitoring`,
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                "Active Coach athlete relationship is required.",
            );
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("isolates athletes between Coaches", async () => {
        const coachA = await createCoach();
        const coachB = await createCoach();
        const athlete = await createAthlete(coachA.tenant.id);

        await createRelationship(
            coachA.tenant.id,
            athlete.id,
            coachA.user.id,
        );

        try {
            const tokenB = await login(
                coachB.tenant.id,
                coachB.user.email,
                coachB.password,
            );

            const response = await request(app)
                .get(
                    `/api/v1/coach/athletes/${athlete.id}/performance-monitoring`,
                )
                .set("Authorization", `Bearer ${tokenB}`);

            expect(response.status).toBe(404);
        } finally {
            await cleanup(coachA, [athlete.id]);
            await cleanup(coachB, []);
        }
    });

    it("rejects an invalid monitoring limit", async () => {
        const coach = await createCoach();
        const athlete = await createAthlete(coach.tenant.id);

        await createRelationship(
            coach.tenant.id,
            athlete.id,
            coach.user.id,
        );

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .get(
                    `/api/v1/coach/athletes/${athlete.id}/performance-monitoring?limit=101`,
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                "Monitoring limit must be an integer between 1 and 100.",
            );
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("returns bounded monitoring for an authorised Coach athlete", async () => {
        const coach = await createCoach();
        const athlete = await createAthlete(coach.tenant.id);

        await createRelationship(
            coach.tenant.id,
            athlete.id,
            coach.user.id,
        );

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .get(
                    `/api/v1/coach/athletes/${athlete.id}/performance-monitoring?limit=5`,
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.athleteId).toBe(athlete.id);
            expect(response.body.performance).toEqual([]);
            expect(response.body.recovery).toEqual([]);
            expect(response.body.trainingStress).toEqual([]);
            expect(response.body.workoutProgrammes).toEqual([]);
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });
});
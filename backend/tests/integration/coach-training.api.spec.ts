import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const permissions = [
    "workout-programmes.create",
    "workout-programmes.update",
];

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
    permissionsOverride: string[] = permissions,
) {
    return createTestUser({
        permissions: permissionsOverride,
    });
}

async function cleanup(
    coach: { user: { id: string } },
    athleteIds: string[],
): Promise<void> {
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

function payload(athleteId: string) {
    return {
        athleteId,
        name: "Coach Training Programme",
        description: "Mission 066.4",
        goal: "GENERAL_FITNESS",
        experience: "BEGINNER",
        trainingFrequency: 3,
        sessionDurationMinutes: 60,
        sportId: null,
    };
}

async function createAthlete(
    tenantId: string,
) {
    return testPrisma.athlete.create({
        data: {
            tenantId,
            firstName: "Coach",
            lastName: "Training",
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
            endsAt:
                status === "INACTIVE"
                    ? new Date()
                    : null,
        },
    });
}

describe("Mission 066.4 Coach training management API", () => {
    it("requires authentication", async () => {
        const response = await request(app)
            .post("/api/v1/coach/training/programmes")
            .send(payload("athlete-id"));

        expect(response.status).toBe(401);
    });

    it("enforces workout-programmes.create", async () => {
        const coach = await createCoach([
            "workout-programmes.update",
        ]);
        const athlete = await createAthlete(
            coach.tenant.id,
        );

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .post("/api/v1/coach/training/programmes")
                .set("Authorization", `Bearer ${token}`)
                .send(payload(athlete.id));

            expect(response.status).toBe(403);
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("creates training only for an active Coach athlete", async () => {
        const coach = await createCoach();
        const athlete = await createAthlete(
            coach.tenant.id,
        );

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
                .post("/api/v1/coach/training/programmes")
                .set("Authorization", `Bearer ${token}`)
                .send(payload(athlete.id));

            expect(response.status).toBe(201);
            expect(response.body.id).toBeTruthy();
            expect(response.body.athleteId).toBe(
                athlete.id,
            );

            const persisted =
                await testPrisma.workoutProgramme.findFirst({
                    where: {
                        id: response.body.id,
                        tenantId: coach.tenant.id,
                        athleteId: athlete.id,
                    },
                });

            expect(persisted).not.toBeNull();
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("rejects an inactive Coach athlete relationship", async () => {
        const coach = await createCoach();
        const athlete = await createAthlete(
            coach.tenant.id,
        );

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
                .post("/api/v1/coach/training/programmes")
                .set("Authorization", `Bearer ${token}`)
                .send(payload(athlete.id));

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                "Active Coach athlete relationship is required.",
            );
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("prevents cross-tenant Coach training access", async () => {
        const coachA = await createCoach();
        const coachB = await createCoach();
        const athleteB = await createAthlete(
            coachB.tenant.id,
        );

        try {
            const tokenA = await login(
                coachA.tenant.id,
                coachA.user.email,
                coachA.password,
            );

            const response = await request(app)
                .post("/api/v1/coach/training/programmes")
                .set("Authorization", `Bearer ${tokenA}`)
                .send(payload(athleteB.id));

            expect(response.status).toBe(400);

            const count =
                await testPrisma.workoutProgramme.count({
                    where: {
                        athleteId: athleteB.id,
                    },
                });

            expect(count).toBe(0);
        } finally {
            await cleanup(coachA, []);
            await cleanup(coachB, [athleteB.id]);
        }
    });

    it("assigns a programme only through the Coach relationship", async () => {
        const coach = await createCoach();
        const athlete = await createAthlete(
            coach.tenant.id,
        );

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

            const created = await request(app)
                .post("/api/v1/coach/training/programmes")
                .set("Authorization", `Bearer ${token}`)
                .send(payload(athlete.id));

            expect(created.status).toBe(201);

            const assigned = await request(app)
                .patch(
                    `/api/v1/coach/training/programmes/${created.body.id}/assignment`,
                )
                .set("Authorization", `Bearer ${token}`)
                .send({ athleteId: athlete.id });

            expect(assigned.status).toBe(200);
            expect(assigned.body.athleteId).toBe(
                athlete.id,
            );
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });

    it("enforces workout-programmes.update on assignment", async () => {
        const coach = await createCoach([
            "workout-programmes.create",
        ]);
        const athlete = await createAthlete(
            coach.tenant.id,
        );

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

            const created = await request(app)
                .post("/api/v1/coach/training/programmes")
                .set("Authorization", `Bearer ${token}`)
                .send(payload(athlete.id));

            expect(created.status).toBe(201);

            const assigned = await request(app)
                .patch(
                    `/api/v1/coach/training/programmes/${created.body.id}/assignment`,
                )
                .set("Authorization", `Bearer ${token}`)
                .send({ athleteId: athlete.id });

            expect(assigned.status).toBe(403);
        } finally {
            await cleanup(coach, [athlete.id]);
        }
    });
});

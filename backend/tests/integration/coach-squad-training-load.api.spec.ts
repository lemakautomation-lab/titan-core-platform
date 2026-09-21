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

async function stress(
    tenantId: string,
    athleteId: string,
    value: number,
    recordedAt: Date,
) {
    return testPrisma.trainingStress.create({
        data: {
            tenantId,
            athleteId,
            value,
            recordedAt,
            sourceType: "DEVICE",
            sourceId: "mission-067-4",
            sourceObservationId: crypto.randomUUID(),
        },
    });
}

describe("Mission 067.4 coach squad training load", () => {
    it("requires authentication", async () => {
        const response = await request(app).get(
            `/api/v1/coach/squads/${crypto.randomUUID()}/training-load`,
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
                name: "Training Load RBAC",
            },
        });

        for (const user of [squadOnly, performanceOnly]) {
            const token = await login(user);

            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squad.id}/training-load`,
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        }
    });

    it("returns bounded chronological training-load observations", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const included = await athlete(
            coach.tenant.id,
            "TrainingLoad",
        );

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Training Load Squad",
            },
        });

        await relationship(
            coach.tenant.id,
            included.id,
            coach.user.id,
        );

        await testPrisma.coachSquadAthlete.create({
            data: {
                tenantId: coach.tenant.id,
                squadId: squad.id,
                athleteId: included.id,
            },
        });

        const t1 = new Date("2026-09-20T08:00:00.000Z");
        const t2 = new Date("2026-09-20T09:00:00.000Z");
        const t3 = new Date("2026-09-20T10:00:00.000Z");

        await stress(
            coach.tenant.id,
            included.id,
            41,
            t1,
        );

        await stress(
            coach.tenant.id,
            included.id,
            52,
            t2,
        );

        await stress(
            coach.tenant.id,
            included.id,
            63,
            t3,
        );

        const response = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/training-load`,
            )
            .query({ limit: 2 })
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.squadId).toBe(squad.id);
        expect(response.body.memberCount).toBe(1);
        expect(response.body.athletes).toHaveLength(1);

        const result = response.body.athletes[0];

        expect(result.athleteId).toBe(included.id);
        expect(result.observationCount).toBe(2);

        expect(
            result.observations.map(
                (item: { recordedAt: string }) =>
                    item.recordedAt,
            ),
        ).toEqual([
            t2.toISOString(),
            t3.toISOString(),
        ]);

        expect(
            result.observations.map(
                (item: { value: number }) =>
                    Number(item.value),
            ),
        ).toEqual([52, 63]);
    });

    it("excludes non-members and athletes without an active Coach relationship", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const included = await athlete(
            coach.tenant.id,
            "Included",
        );

        const stale = await athlete(
            coach.tenant.id,
            "Stale",
        );

        const nonMember = await athlete(
            coach.tenant.id,
            "Outside",
        );

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Training Load Authority",
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

        await Promise.all([
            stress(
                coach.tenant.id,
                included.id,
                50,
                new Date("2026-09-20T08:00:00.000Z"),
            ),
            stress(
                coach.tenant.id,
                stale.id,
                60,
                new Date("2026-09-20T09:00:00.000Z"),
            ),
            stress(
                coach.tenant.id,
                nonMember.id,
                70,
                new Date("2026-09-20T10:00:00.000Z"),
            ),
        ]);

        const response = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/training-load`,
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.memberCount).toBe(1);
        expect(response.body.athletes).toHaveLength(1);
        expect(response.body.athletes[0].athleteId)
            .toBe(included.id);
        expect(response.body.athletes[0].observationCount)
            .toBe(1);
    });

    it("returns an empty athlete set for an owned empty squad", async () => {
        const coach = await createTestUser({ permissions });
        const token = await login(coach);

        const squad = await testPrisma.coachSquad.create({
            data: {
                tenantId: coach.tenant.id,
                coachUserId: coach.user.id,
                name: "Empty Training Load",
            },
        });

        const response = await request(app)
            .get(
                `/api/v1/coach/squads/${squad.id}/training-load`,
            )
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
                name: "Other Training Load",
            },
        });

        const foreignSquad = await testPrisma.coachSquad.create({
            data: {
                tenantId: foreignCoach.tenant.id,
                coachUserId: foreignCoach.user.id,
                name: "Foreign Training Load",
            },
        });

        const token = await login(coach);

        for (const squadId of [
            otherSquad.id,
            foreignSquad.id,
        ]) {
            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squadId}/training-load`,
                )
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
                name: "Training Load Validation",
            },
        });

        for (const limit of [
            "0",
            "101",
            "1.5",
            "invalid",
        ]) {
            const response = await request(app)
                .get(
                    `/api/v1/coach/squads/${squad.id}/training-load`,
                )
                .query({ limit })
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
        }
    });
});

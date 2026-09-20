import request from "supertest";
import {
    describe,
    expect,
    it,
} from "vitest";

import app from "../../src/app";
import { createTestUser } from "../factories/user.factory";
import { testPrisma } from "../helpers/prisma-test.client";

const permissions = [
    "coach-athletes.update",
    "coach-athletes.read",
    "coach-athletes.update",
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

async function createAuthorizedCoach(
    options: {
        tenantId?: string;
        permissions?: string[];
    } = {},
) {
    return createTestUser({
        tenantId: options.tenantId,
        permissions:
            options.permissions ?? permissions,
    });
}

async function cleanupUser(
    user: {
        id: string;
        tenantId: string;
    },
): Promise<void> {
await testPrisma.session.deleteMany({
        where: {
            userId: user.id,
        },
    });

    await testPrisma.userRole.deleteMany({
        where: {
            userId: user.id,
        },
    });

    await testPrisma.user.deleteMany({
        where: {
            id: user.id,
        },
    });
}

describe("Mission 066.3 Coach athlete management API", () => {
    it("requires authentication", async () => {
        const response = await request(app)
            .get("/api/v1/coach/athletes");

        expect(response.status).toBe(401);
    });

    it("rejects add without coach-athletes.update", async () => {
        const coach = await createAuthorizedCoach({
            permissions: ["coach-athletes.read"],
        });

        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: coach.tenant.id,
                firstName: "No",
                lastName: "Permission",
            },
        });

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .post("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${token}`)
                .send({ athleteId: athlete.id });

            expect(response.status).toBe(403);
        } finally {
            await testPrisma.athleteRelationship.deleteMany({
                where: { athleteId: athlete.id },
            });
            await testPrisma.athlete.delete({
                where: { id: athlete.id },
            });
            await cleanupUser(coach.user);
        }
    });

    it("adds, lists and removes an athlete for the authenticated coach", async () => {
        const coach = await createAuthorizedCoach();

        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: coach.tenant.id,
                firstName: "Coach",
                lastName: "Athlete",
            },
        });

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const add = await request(app)
                .post("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${token}`)
                .send({ athleteId: athlete.id });

            expect(add.status).toBe(201);
            expect(add.body.relationshipId).toBeTruthy();

            const persisted =
                await testPrisma.athleteRelationship.findFirst({
                    where: {
                        tenantId: coach.tenant.id,
                        athleteId: athlete.id,
                        relatedEntityId: coach.user.id,
                        relationshipType: "COACH",
                    },
                });

            expect(persisted).not.toBeNull();
            expect(persisted?.status).toBe("ACTIVE");

            const list = await request(app)
                .get("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${token}`);

            expect(list.status).toBe(200);
            expect(Array.isArray(list.body)).toBe(true);

            expect(
                list.body.some(
                    (item: { athleteId: string }) =>
                        item.athleteId === athlete.id,
                ),
            ).toBe(true);

            const remove = await request(app)
                .delete(`/api/v1/coach/athletes/${athlete.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(remove.status).toBe(204);

            const ended =
                await testPrisma.athleteRelationship.findFirst({
                    where: {
                        tenantId: coach.tenant.id,
                        athleteId: athlete.id,
                        relatedEntityId: coach.user.id,
                        relationshipType: "COACH",
                    },
                });

            expect(ended?.status).toBe("INACTIVE");
            expect(ended?.endsAt).not.toBeNull();
        } finally {
            await testPrisma.athleteRelationship.deleteMany({
                where: { athleteId: athlete.id },
            });
            await testPrisma.athlete.delete({
                where: { id: athlete.id },
            });
            await cleanupUser(coach.user);
        }
    });

    it("reactivates an inactive Coach relationship", async () => {
        const coach = await createAuthorizedCoach();

        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: coach.tenant.id,
                firstName: "Reactivate",
                lastName: "Athlete",
            },
        });

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const first = await request(app)
                .post("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${token}`)
                .send({ athleteId: athlete.id });

            expect(first.status).toBe(201);

            const remove = await request(app)
                .delete(`/api/v1/coach/athletes/${athlete.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(remove.status).toBe(204);

            const second = await request(app)
                .post("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${token}`)
                .send({ athleteId: athlete.id });

            expect(second.status).toBe(201);
            expect(second.body.relationshipId)
                .toBe(first.body.relationshipId);

            const relationship =
                await testPrisma.athleteRelationship.findFirst({
                    where: {
                        tenantId: coach.tenant.id,
                        athleteId: athlete.id,
                        relatedEntityId: coach.user.id,
                        relationshipType: "COACH",
                    },
                });

            expect(relationship?.status).toBe("ACTIVE");
            expect(relationship?.endsAt).toBeNull();
        } finally {
            await testPrisma.athleteRelationship.deleteMany({
                where: { athleteId: athlete.id },
            });
            await testPrisma.athlete.delete({
                where: { id: athlete.id },
            });
            await cleanupUser(coach.user);
        }
    });

    it("isolates athletes between coaches in the same tenant", async () => {
        const coachA = await createAuthorizedCoach();
        const coachB = await createAuthorizedCoach({
            tenantId: coachA.tenant.id,
        });

        const athlete = await testPrisma.athlete.create({
            data: {
                tenantId: coachA.tenant.id,
                firstName: "Private",
                lastName: "Athlete",
            },
        });

        try {
            const tokenA = await login(
                coachA.tenant.id,
                coachA.user.email,
                coachA.password,
            );

            const tokenB = await login(
                coachB.tenant.id,
                coachB.user.email,
                coachB.password,
            );

            expect(
                (
                    await request(app)
                        .post("/api/v1/coach/athletes")
                        .set("Authorization", `Bearer ${tokenA}`)
                        .send({ athleteId: athlete.id })
                ).status,
            ).toBe(201);

            const listB = await request(app)
                .get("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${tokenB}`);

            expect(listB.status).toBe(200);

            expect(
                listB.body.some(
                    (item: { athleteId: string }) =>
                        item.athleteId === athlete.id,
                ),
            ).toBe(false);

            const removeB = await request(app)
                .delete(`/api/v1/coach/athletes/${athlete.id}`)
                .set("Authorization", `Bearer ${tokenB}`);

            expect(removeB.status).toBe(404);
        } finally {
            await testPrisma.athleteRelationship.deleteMany({
                where: { athleteId: athlete.id },
            });
            await testPrisma.athlete.delete({
                where: { id: athlete.id },
            });
            await cleanupUser(coachB.user);
            await cleanupUser(coachA.user);
        }
    });

    it("enforces cross-tenant isolation", async () => {
        const coachA = await createAuthorizedCoach();
        const coachB = await createAuthorizedCoach();

        const athleteB = await testPrisma.athlete.create({
            data: {
                tenantId: coachB.tenant.id,
                firstName: "Tenant",
                lastName: "B",
            },
        });

        try {
            const tokenA = await login(
                coachA.tenant.id,
                coachA.user.email,
                coachA.password,
            );

            const response = await request(app)
                .post("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${tokenA}`)
                .send({ athleteId: athleteB.id });

            expect(response.status).toBe(404);

            const leaked =
                await testPrisma.athleteRelationship.findFirst({
                    where: {
                        athleteId: athleteB.id,
                        relatedEntityId: coachA.user.id,
                    },
                });

            expect(leaked).toBeNull();
        } finally {
            await testPrisma.athleteRelationship.deleteMany({
                where: { athleteId: athleteB.id },
            });
            await testPrisma.athlete.delete({
                where: { id: athleteB.id },
            });
            await cleanupUser(coachB.user);
            await cleanupUser(coachA.user);
        }
    });

    it("enforces coach-athletes.read", async () => {
        const coach = await createAuthorizedCoach({
            permissions: ["coach-athletes.update"],
        });

        try {
            const token = await login(
                coach.tenant.id,
                coach.user.email,
                coach.password,
            );

            const response = await request(app)
                .get("/api/v1/coach/athletes")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
        } finally {
            await cleanupUser(coach.user);
        }
    });
});
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
    "coach-squads.create",
    "coach-squads.read",
    "coach-squads.update",
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

async function createCoach(
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

async function cleanup(
    coaches: Array<{
        user: {
            id: string;
            tenantId: string;
        };
    }>,
    athleteIds: string[],
): Promise<void> {
    await testPrisma.coachSquadAthlete.deleteMany({
        where: {
            athleteId: {
                in: athleteIds,
            },
        },
    });

    await testPrisma.athleteRelationship.deleteMany({
        where: {
            athleteId: {
                in: athleteIds,
            },
        },
    });

    await testPrisma.athlete.deleteMany({
        where: {
            id: {
                in: athleteIds,
            },
        },
    });

    for (const coach of coaches) {
        await testPrisma.coachSquad.deleteMany({
            where: {
                tenantId: coach.user.tenantId,
                coachUserId: coach.user.id,
            },
        });

        await testPrisma.session.deleteMany({
            where: {
                userId: coach.user.id,
            },
        });

        await testPrisma.userRole.deleteMany({
            where: {
                userId: coach.user.id,
            },
        });

        await testPrisma.user.deleteMany({
            where: {
                id: coach.user.id,
            },
        });
    }
}

describe("Mission 067.1 Coach squad membership API", () => {
    it("requires authentication", async () => {
        const response =
            await request(app)
                .get("/api/v1/coach/squads/unknown/athletes");

        expect(response.status).toBe(401);
    });

    it("requires coach-squads.update when adding membership", async () => {
        const coach =
            await createCoach({
                permissions: [
                    "coach-squads.create",
                    "coach-squads.read",
                ],
            });

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId: coach.tenant.id,
                    firstName: "Permission",
                    lastName: "Athlete",
                },
            });

        const squad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coach.tenant.id,
                    coachUserId: coach.user.id,
                    name: "Permission Squad",
                },
            });

        try {
            await createRelationship(
                coach.tenant.id,
                athlete.id,
                coach.user.id,
            );

            const token =
                await login(
                    coach.tenant.id,
                    coach.user.email,
                    coach.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/coach/squads/${squad.id}/athletes`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        athleteId: athlete.id,
                    });

            expect(response.status).toBe(403);
        } finally {
            await cleanup(
                [coach],
                [athlete.id],
            );
        }
    });

    it("adds, lists and removes an actively related athlete", async () => {
        const coach = await createCoach();

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId: coach.tenant.id,
                    firstName: "Squad",
                    lastName: "Athlete",
                    countryCode: "ZA",
                },
            });

        const squad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coach.tenant.id,
                    coachUserId: coach.user.id,
                    name: "Performance Squad",
                },
            });

        try {
            await createRelationship(
                coach.tenant.id,
                athlete.id,
                coach.user.id,
            );

            const token =
                await login(
                    coach.tenant.id,
                    coach.user.email,
                    coach.password,
                );

            const add =
                await request(app)
                    .post(
                        `/api/v1/coach/squads/${squad.id}/athletes`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        athleteId: athlete.id,
                    });

            expect(add.status).toBe(201);
            expect(add.body).toEqual({
                squadId: squad.id,
                athleteId: athlete.id,
            });

            const persisted =
                await testPrisma.coachSquadAthlete.findFirst({
                    where: {
                        tenantId: coach.tenant.id,
                        squadId: squad.id,
                        athleteId: athlete.id,
                    },
                });

            expect(persisted).not.toBeNull();

            const list =
                await request(app)
                    .get(
                        `/api/v1/coach/squads/${squad.id}/athletes`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(list.status).toBe(200);
            expect(list.body).toHaveLength(1);
            expect(list.body[0]).toMatchObject({
                athleteId: athlete.id,
                firstName: "Squad",
                lastName: "Athlete",
                countryCode: "ZA",
            });

            const remove =
                await request(app)
                    .delete(
                        `/api/v1/coach/squads/${squad.id}/athletes/${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(remove.status).toBe(204);

            const removed =
                await testPrisma.coachSquadAthlete.findFirst({
                    where: {
                        tenantId: coach.tenant.id,
                        squadId: squad.id,
                        athleteId: athlete.id,
                    },
                });

            expect(removed).toBeNull();
        } finally {
            await cleanup(
                [coach],
                [athlete.id],
            );
        }
    });

    it("rejects inactive Coach relationships", async () => {
        const coach = await createCoach();

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId: coach.tenant.id,
                    firstName: "Inactive",
                    lastName: "Athlete",
                },
            });

        const squad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coach.tenant.id,
                    coachUserId: coach.user.id,
                    name: "Inactive Test",
                },
            });

        try {
            await createRelationship(
                coach.tenant.id,
                athlete.id,
                coach.user.id,
                "INACTIVE",
            );

            const token =
                await login(
                    coach.tenant.id,
                    coach.user.email,
                    coach.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/coach/squads/${squad.id}/athletes`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        athleteId: athlete.id,
                    });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                "Active Coach athlete relationship is required.",
            );
        } finally {
            await cleanup(
                [coach],
                [athlete.id],
            );
        }
    });

    it("rejects duplicate squad membership", async () => {
        const coach = await createCoach();

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId: coach.tenant.id,
                    firstName: "Duplicate",
                    lastName: "Athlete",
                },
            });

        const squad =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coach.tenant.id,
                    coachUserId: coach.user.id,
                    name: "Duplicate Test",
                },
            });

        try {
            await createRelationship(
                coach.tenant.id,
                athlete.id,
                coach.user.id,
            );

            const token =
                await login(
                    coach.tenant.id,
                    coach.user.email,
                    coach.password,
                );

            const endpoint =
                `/api/v1/coach/squads/${squad.id}/athletes`;

            expect(
                (
                    await request(app)
                        .post(endpoint)
                        .set(
                            "Authorization",
                            `Bearer ${token}`,
                        )
                        .send({
                            athleteId: athlete.id,
                        })
                ).status,
            ).toBe(201);

            const duplicate =
                await request(app)
                    .post(endpoint)
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        athleteId: athlete.id,
                    });

            expect(duplicate.status).toBe(400);
            expect(duplicate.body.error).toBe(
                "Athlete is already a member of this squad.",
            );
        } finally {
            await cleanup(
                [coach],
                [athlete.id],
            );
        }
    });

    it("isolates squad membership between coaches in the same tenant", async () => {
        const coachA = await createCoach();

        const coachB =
            await createCoach({
                tenantId: coachA.tenant.id,
            });

        const athlete =
            await testPrisma.athlete.create({
                data: {
                    tenantId: coachA.tenant.id,
                    firstName: "Private",
                    lastName: "Squad Athlete",
                },
            });

        const squadA =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coachA.tenant.id,
                    coachUserId: coachA.user.id,
                    name: "Coach A Squad",
                },
            });

        try {
            await createRelationship(
                coachA.tenant.id,
                athlete.id,
                coachA.user.id,
            );

            const tokenA =
                await login(
                    coachA.tenant.id,
                    coachA.user.email,
                    coachA.password,
                );

            const tokenB =
                await login(
                    coachB.tenant.id,
                    coachB.user.email,
                    coachB.password,
                );

            expect(
                (
                    await request(app)
                        .post(
                            `/api/v1/coach/squads/${squadA.id}/athletes`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${tokenA}`,
                        )
                        .send({
                            athleteId: athlete.id,
                        })
                ).status,
            ).toBe(201);

            const readByB =
                await request(app)
                    .get(
                        `/api/v1/coach/squads/${squadA.id}/athletes`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${tokenB}`,
                    );

            expect(readByB.status).toBe(404);

            const removeByB =
                await request(app)
                    .delete(
                        `/api/v1/coach/squads/${squadA.id}/athletes/${athlete.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${tokenB}`,
                    );

            expect(removeByB.status).toBe(404);

            const persisted =
                await testPrisma.coachSquadAthlete.findFirst({
                    where: {
                        tenantId: coachA.tenant.id,
                        squadId: squadA.id,
                        athleteId: athlete.id,
                    },
                });

            expect(persisted).not.toBeNull();
        } finally {
            await cleanup(
                [coachB, coachA],
                [athlete.id],
            );
        }
    });

    it("enforces cross-tenant isolation", async () => {
        const coachA = await createCoach();
        const coachB = await createCoach();

        const athleteB =
            await testPrisma.athlete.create({
                data: {
                    tenantId: coachB.tenant.id,
                    firstName: "Tenant",
                    lastName: "B",
                },
            });

        const squadA =
            await testPrisma.coachSquad.create({
                data: {
                    tenantId: coachA.tenant.id,
                    coachUserId: coachA.user.id,
                    name: "Tenant A Squad",
                },
            });

        try {
            const tokenA =
                await login(
                    coachA.tenant.id,
                    coachA.user.email,
                    coachA.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/coach/squads/${squadA.id}/athletes`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${tokenA}`,
                    )
                    .send({
                        athleteId: athleteB.id,
                    });

            expect(response.status).toBe(404);

            const leaked =
                await testPrisma.coachSquadAthlete.findFirst({
                    where: {
                        squadId: squadA.id,
                        athleteId: athleteB.id,
                    },
                });

            expect(leaked).toBeNull();
        } finally {
            await cleanup(
                [coachB, coachA],
                [athleteB.id],
            );
        }
    });
});

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
    await testPrisma.coachSquad.deleteMany({
        where: {
            tenantId: user.tenantId,
            coachUserId: user.id,
        },
    });

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

describe("Mission 066.1 Coach squad API", () => {
it("requires authentication", async () => {
        const response =
            await request(app)
                .get("/api/v1/coach/squads");

        expect(response.status).toBe(401);
    });

    it("rejects creation without create permission", async () => {
        const {
            user,
            password,
        } = await createTestUser({
            permissions: [
                "coach-squads.read",
            ],
        });

        try {
            const token =
                await login(
                    user.tenantId,
                    user.email,
                    password,
                );

            const response =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        name: "Elite Squad",
                    });

            expect(response.status).toBe(403);
        } finally {
            await cleanupUser(user);
        }
    });

    it("creates, lists and updates only the authenticated coach's squad", async () => {
        const {
            user,
            password,
        } = await createAuthorizedCoach();

        try {
            const token =
                await login(
                    user.tenantId,
                    user.email,
                    password,
                );

            const createResponse =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        name: "Elite Squad",
                        description:
                            "High performance squad",
                    });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.name)
                .toBe("Elite Squad");
            expect(createResponse.body.description)
                .toBe("High performance squad");
            expect(createResponse.body.status)
                .toBe("ACTIVE");

            const squadId =
                createResponse.body.id as string;

            const persisted =
                await testPrisma.coachSquad.findUnique({
                    where: {
                        id: squadId,
                    },
                });

            expect(persisted?.tenantId)
                .toBe(user.tenantId);
            expect(persisted?.coachUserId)
                .toBe(user.id);

            const listResponse =
                await request(app)
                    .get("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    );

            expect(listResponse.status).toBe(200);
            expect(listResponse.body).toHaveLength(1);
            expect(listResponse.body[0].id)
                .toBe(squadId);

            const updateResponse =
                await request(app)
                    .patch(
                        `/api/v1/coach/squads/${squadId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        name: "Elite Performance",
                        description: null,
                    });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.name)
                .toBe("Elite Performance");
            expect(updateResponse.body.description)
                .toBeNull();
        } finally {
            await cleanupUser(user);
        }
    });

    it("validates squad details", async () => {
        const {
            user,
            password,
        } = await createAuthorizedCoach();

        try {
            const token =
                await login(
                    user.tenantId,
                    user.email,
                    password,
                );

            const emptyName =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        name: "   ",
                    });

            expect(emptyName.status).toBe(400);

            const longDescription =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${token}`,
                    )
                    .send({
                        name: "Valid Squad",
                        description: "x".repeat(1001),
                    });

            expect(longDescription.status).toBe(400);
        } finally {
            await cleanupUser(user);
        }
    });

    it("enforces same-tenant coach ownership", async () => {
        const first =
            await createAuthorizedCoach();

        const second =
            await createAuthorizedCoach({
                tenantId: first.user.tenantId,
            });

        try {
            const firstToken =
                await login(
                    first.user.tenantId,
                    first.user.email,
                    first.password,
                );

            const secondToken =
                await login(
                    second.user.tenantId,
                    second.user.email,
                    second.password,
                );

            const created =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${firstToken}`,
                    )
                    .send({
                        name: "Private Squad",
                    });

            expect(created.status).toBe(201);

            const squadId =
                created.body.id as string;

            const secondList =
                await request(app)
                    .get("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${secondToken}`,
                    );

            expect(secondList.status).toBe(200);
            expect(secondList.body).toEqual([]);

            const secondUpdate =
                await request(app)
                    .patch(
                        `/api/v1/coach/squads/${squadId}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${secondToken}`,
                    )
                    .send({
                        name: "Unauthorized Change",
                    });

            expect(secondUpdate.status).toBe(404);
        } finally {
            await cleanupUser(second.user);
            await cleanupUser(first.user);
        }
    });

    it("enforces tenant isolation", async () => {
        const first =
            await createAuthorizedCoach();

        const second =
            await createAuthorizedCoach();

        try {
            const firstToken =
                await login(
                    first.user.tenantId,
                    first.user.email,
                    first.password,
                );

            const secondToken =
                await login(
                    second.user.tenantId,
                    second.user.email,
                    second.password,
                );

            const created =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${firstToken}`,
                    )
                    .send({
                        name: "Tenant A Squad",
                    });

            expect(created.status).toBe(201);

            const foreignUpdate =
                await request(app)
                    .patch(
                        `/api/v1/coach/squads/${created.body.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${secondToken}`,
                    )
                    .send({
                        name: "Cross Tenant Change",
                    });

            expect(foreignUpdate.status).toBe(404);

            const secondList =
                await request(app)
                    .get("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${secondToken}`,
                    );

            expect(secondList.status).toBe(200);
            expect(secondList.body).toEqual([]);
        } finally {
            await cleanupUser(second.user);
            await cleanupUser(first.user);
        }
    });

    it("enforces read and update permissions", async () => {
        const creator =
            await createAuthorizedCoach();

        try {
            const creatorToken =
                await login(
                    creator.user.tenantId,
                    creator.user.email,
                    creator.password,
                );

            const created =
                await request(app)
                    .post("/api/v1/coach/squads")
                    .set(
                        "Authorization",
                        `Bearer ${creatorToken}`,
                    )
                    .send({
                        name: "Permission Squad",
                    });

            expect(created.status).toBe(201);

            const noRead =
                await createAuthorizedCoach({
                    tenantId: creator.user.tenantId,
                    permissions: [
                        "coach-squads.update",
                    ],
                });

            const noUpdate =
                await createAuthorizedCoach({
                    tenantId: creator.user.tenantId,
                    permissions: [
                        "coach-squads.read",
                    ],
                });

            try {
                const noReadToken =
                    await login(
                        noRead.user.tenantId,
                        noRead.user.email,
                        noRead.password,
                    );

                const noUpdateToken =
                    await login(
                        noUpdate.user.tenantId,
                        noUpdate.user.email,
                        noUpdate.password,
                    );

                const readResponse =
                    await request(app)
                        .get("/api/v1/coach/squads")
                        .set(
                            "Authorization",
                            `Bearer ${noReadToken}`,
                        );

                expect(readResponse.status).toBe(403);

                const updateResponse =
                    await request(app)
                        .patch(
                            `/api/v1/coach/squads/${created.body.id}`,
                        )
                        .set(
                            "Authorization",
                            `Bearer ${noUpdateToken}`,
                        )
                        .send({
                            name: "Blocked",
                        });

                expect(updateResponse.status).toBe(403);
            } finally {
                await cleanupUser(noUpdate.user);
                await cleanupUser(noRead.user);
            }
        } finally {
            await cleanupUser(creator.user);
        }
    });
});
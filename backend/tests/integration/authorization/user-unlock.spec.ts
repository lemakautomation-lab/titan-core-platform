import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

describe("User Unlock Authorization", () => {

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


    async function lockUser(
        userId: string,
    ): Promise<void> {

        await testPrisma.user.update({
            where: {
                id: userId,
            },
            data: {
                status: "LOCKED",
            },
        });
    }


    it(
        "unlocks a locked user when actor has users.update",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });

            const target =
                await createTestUser({
                    tenantId: actor.tenant.id,
                });

            await lockUser(
                target.user.id,
            );

            const accessToken =
                await login(
                    actor.tenant.id,
                    actor.user.email,
                    actor.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/unlock`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(200);

            expect(
                response.body.status,
            ).toBe("ACTIVE");

            const user =
                await testPrisma.user.findUnique({
                    where: {
                        id: target.user.id,
                    },
                });

            expect(
                user?.status,
            ).toBe("ACTIVE");

        },
    );


    it(
        "rejects unlock when target user is not locked",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });

            const target =
                await createTestUser({
                    tenantId: actor.tenant.id,
                });

            const accessToken =
                await login(
                    actor.tenant.id,
                    actor.user.email,
                    actor.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/unlock`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(409);

            expect(
                response.body.error.message,
            ).toBe(
                "User is not locked",
            );

        },
    );


    it(
        "blocks cross-tenant unlock",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });

            const target =
                await createTestUser();

            await lockUser(
                target.user.id,
            );

            const accessToken =
                await login(
                    actor.tenant.id,
                    actor.user.email,
                    actor.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/unlock`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            const user =
                await testPrisma.user.findUnique({
                    where: {
                        id: target.user.id,
                    },
                });

            expect(
                user?.status,
            ).toBe("LOCKED");

        },
    );


    it(
        "blocks unlock when actor lacks users.update",
        async () => {

            const actor =
                await createTestUser();

            const target =
                await createTestUser({
                    tenantId: actor.tenant.id,
                });

            await lockUser(
                target.user.id,
            );

            const accessToken =
                await login(
                    actor.tenant.id,
                    actor.user.email,
                    actor.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/unlock`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            const user =
                await testPrisma.user.findUnique({
                    where: {
                        id: target.user.id,
                    },
                });

            expect(
                user?.status,
            ).toBe("LOCKED");

        },
    );


    it(
        "persists ACCOUNT_UNLOCKED audit event",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });

            const target =
                await createTestUser({
                    tenantId: actor.tenant.id,
                });

            await lockUser(
                target.user.id,
            );

            const accessToken =
                await login(
                    actor.tenant.id,
                    actor.user.email,
                    actor.password,
                );

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/unlock`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(200);

            const auditLog =
                await testPrisma.auditLog.findFirst({
                    where: {
                        tenantId:
                            actor.tenant.id,
                        userId:
                            actor.user.id,
                        action:
                            "ACCOUNT_UNLOCKED",
                        resource:
                            "USER",
                        resourceId:
                            target.user.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            expect(
                auditLog,
            ).not.toBeNull();

        },
    );
});

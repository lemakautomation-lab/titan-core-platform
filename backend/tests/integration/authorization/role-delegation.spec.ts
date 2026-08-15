import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { createRole } from "../../factories/role.factory";
import { testPrisma } from "../../helpers/prisma-test.client";
import { hashTestPassword } from "../../helpers/password.helper";

async function createSameTenantUser(
    tenantId: string,
) {

    const password =
        "Password123!";

    const passwordHash =
        await hashTestPassword(
            password,
        );

    const user =
        await testPrisma.user.create({
            data: {
                tenantId,
                email:
                    `delegation-target-${Date.now()}-${Math.random()}@titan.test`,
                passwordHash,
            },
        });

    return {
        user,
        password,
    };
}

describe("Authorization Role Delegation", () => {

    it(
        "denies assigning a role when the actor lacks one of the role permissions",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                        "reports.read",
                    ],
                });

            const target =
                await createSameTenantUser(
                    actor.tenant.id,
                );

            const role =
                await createRole(
                    actor.tenant.id,
                    `privileged-role-${Date.now()}`,
                    [
                        "reports.read",
                        "billing.manage",
                    ],
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            actor.tenant.id,
                        email:
                            actor.user.email,
                        password:
                            actor.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/roles/${role.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            const assignment =
                await testPrisma.userRole.findUnique({
                    where: {
                        userId_roleId: {
                            userId:
                                target.user.id,
                            roleId:
                                role.id,
                        },
                    },
                });

            expect(
                assignment,
            ).toBeNull();
        },
    );


    it(
        "denies assigning a permissionless role",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });

            const target =
                await createSameTenantUser(
                    actor.tenant.id,
                );

            const role =
                await createRole(
                    actor.tenant.id,
                    `empty-role-${Date.now()}`,
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            actor.tenant.id,
                        email:
                            actor.user.email,
                        password:
                            actor.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .post(
                        `/api/v1/users/${target.user.id}/roles/${role.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            const assignment =
                await testPrisma.userRole.findUnique({
                    where: {
                        userId_roleId: {
                            userId:
                                target.user.id,
                            roleId:
                                role.id,
                        },
                    },
                });

            expect(
                assignment,
            ).toBeNull();
        },
    );


    it(
        "denies removing a role when the actor lacks one of the role permissions",
        async () => {

            const actor =
                await createTestUser({
                    permissions: [
                        "users.update",
                        "reports.read",
                    ],
                });

            const target =
                await createSameTenantUser(
                    actor.tenant.id,
                );

            const role =
                await createRole(
                    actor.tenant.id,
                    `privileged-remove-role-${Date.now()}`,
                    [
                        "reports.read",
                        "billing.manage",
                    ],
                );

            await testPrisma.userRole.create({
                data: {
                    userId:
                        target.user.id,
                    roleId:
                        role.id,
                },
            });

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            actor.tenant.id,
                        email:
                            actor.user.email,
                        password:
                            actor.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .delete(
                        `/api/v1/users/${target.user.id}/roles/${role.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(403);

            const assignment =
                await testPrisma.userRole.findUnique({
                    where: {
                        userId_roleId: {
                            userId:
                                target.user.id,
                            roleId:
                                role.id,
                        },
                    },
                });

            expect(
                assignment,
            ).not.toBeNull();
        },
    );

});

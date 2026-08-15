import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { createRole } from "../../factories/role.factory";
import { createPermission } from "../../factories/permission.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

describe("RBAC Tenant Isolation", () => {

    it(
        "lists only roles belonging to the authenticated tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "roles.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const tenantARole =
                await createRole(
                    tenantAUser.tenant.id,
                    `tenant-a-role-${Date.now()}`,
                );

            const tenantBRole =
                await createRole(
                    tenantBUser.tenant.id,
                    `tenant-b-role-${Date.now()}`,
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,
                        email:
                            tenantAUser.user.email,
                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get("/api/v1/roles")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(200);

            const roles =
                response.body;

            expect(
                Array.isArray(roles),
            ).toBe(true);

            expect(
                roles.some(
                    (role: { id: string }) =>
                        role.id === tenantARole.id,
                ),
            ).toBe(true);

            expect(
                roles.some(
                    (role: { id: string }) =>
                        role.id === tenantBRole.id,
                ),
            ).toBe(false);

        },
    );

    it(
        "cannot read a role belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "roles.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const role =
                await createRole(
                    tenantBUser.tenant.id,
                    `tenant-b-role-by-id-${Date.now()}`,
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,
                        email:
                            tenantAUser.user.email,
                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get(
                        `/api/v1/roles/${role.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(404);

        },
    );

    it(
        "lists only permissions belonging to the authenticated tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "permissions.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const tenantAPermission =
                await createPermission(
                    tenantAUser.tenant.id,
                    `tenant-a-permission-${Date.now()}`,
                );

            const tenantBPermission =
                await createPermission(
                    tenantBUser.tenant.id,
                    `tenant-b-permission-${Date.now()}`,
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,
                        email:
                            tenantAUser.user.email,
                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get("/api/v1/permissions")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(200);

            const permissions =
                response.body;

            expect(
                Array.isArray(permissions),
            ).toBe(true);

            expect(
                permissions.some(
                    (permission: { id: string }) =>
                        permission.id ===
                        tenantAPermission.id,
                ),
            ).toBe(true);

            expect(
                permissions.some(
                    (permission: { id: string }) =>
                        permission.id ===
                        tenantBPermission.id,
                ),
            ).toBe(false);

        },
    );

    it(
        "cannot read a permission belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "permissions.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const permission =
                await createPermission(
                    tenantBUser.tenant.id,
                    `tenant-b-permission-by-id-${Date.now()}`,
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,
                        email:
                            tenantAUser.user.email,
                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get(
                        `/api/v1/permissions/${permission.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(404);

        },
    );

    it(
        "cannot read role permissions belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "roles.read",
                    ],
                });

            const tenantBUser =
                await createTestUser();

            const role =
                await createRole(
                    tenantBUser.tenant.id,
                    `tenant-b-role-permissions-${Date.now()}`,
                );

            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            tenantAUser.tenant.id,
                        email:
                            tenantAUser.user.email,
                        password:
                            tenantAUser.password,
                    });

            expect(
                loginResponse.status,
            ).toBe(200);

            const accessToken =
                loginResponse.body.data.accessToken;

            const response =
                await request(app)
                    .get(
                        `/api/v1/roles/${role.id}/permissions`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );

            expect(
                response.status,
            ).toBe(404);

        },
    );

it(
    "cannot assign another tenant's permission to an own-tenant role",
    async () => {

        const tenantAUser =
            await createTestUser({
                permissions: [
                    "roles.update",
                "roles.permissions.manage",
                ],
            });

        const tenantBUser =
            await createTestUser();

        const tenantARole =
            await createRole(
                tenantAUser.tenant.id,
                `tenant-a-role-assign-${Date.now()}`,
            );

        const tenantBPermission =
            await createPermission(
                tenantBUser.tenant.id,
                `tenant-b-permission-assign-${Date.now()}`,
            );

        const loginResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        tenantAUser.tenant.id,
                    email:
                        tenantAUser.user.email,
                    password:
                        tenantAUser.password,
                });

        expect(loginResponse.status).toBe(200);

        const accessToken =
            loginResponse.body.data.accessToken;

        const response =
            await request(app)
                .post(
                    `/api/v1/roles/${tenantARole.id}/permissions/${tenantBPermission.id}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

        expect(response.status).toBe(400);

        const assignment =
            await testPrisma.rolePermission.findUnique({
                where: {
                    roleId_permissionId: {
                        roleId: tenantARole.id,
                        permissionId: tenantBPermission.id,
                    },
                },
            });

        expect(assignment).toBeNull();

    },
);

it(
    "cannot assign an own-tenant permission to another tenant's role",
    async () => {

        const tenantAUser =
            await createTestUser({
                permissions: [
                    "roles.update",
                "roles.permissions.manage",
                ],
            });

        const tenantBUser =
            await createTestUser();

        const tenantBRole =
            await createRole(
                tenantBUser.tenant.id,
                `tenant-b-role-assign-${Date.now()}`,
            );

        const tenantAPermission =
            await createPermission(
                tenantAUser.tenant.id,
                `tenant-a-permission-assign-${Date.now()}`,
            );

        const loginResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        tenantAUser.tenant.id,
                    email:
                        tenantAUser.user.email,
                    password:
                        tenantAUser.password,
                });

        expect(loginResponse.status).toBe(200);

        const accessToken =
            loginResponse.body.data.accessToken;

        const response =
            await request(app)
                .post(
                    `/api/v1/roles/${tenantBRole.id}/permissions/${tenantAPermission.id}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

        expect(response.status).toBe(400);

        const assignment =
            await testPrisma.rolePermission.findUnique({
                where: {
                    roleId_permissionId: {
                        roleId: tenantBRole.id,
                        permissionId: tenantAPermission.id,
                    },
                },
            });

        expect(assignment).toBeNull();

    },
);

it(
    "cannot delete another tenant's role permission assignment",
    async () => {

        const tenantAUser =
            await createTestUser({
                permissions: [
                    "roles.update",
                "roles.permissions.manage",
                ],
            });

        const tenantBUser =
            await createTestUser();

        const tenantBRole =
            await createRole(
                tenantBUser.tenant.id,
                `tenant-b-role-delete-assignment-${Date.now()}`,
            );

        const tenantBPermission =
            await createPermission(
                tenantBUser.tenant.id,
                `tenant-b-permission-delete-assignment-${Date.now()}`,
            );

        await testPrisma.rolePermission.create({
            data: {
                roleId: tenantBRole.id,
                permissionId: tenantBPermission.id,
            },
        });

        const loginResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        tenantAUser.tenant.id,
                    email:
                        tenantAUser.user.email,
                    password:
                        tenantAUser.password,
                });

        expect(loginResponse.status).toBe(200);

        const accessToken =
            loginResponse.body.data.accessToken;

        const response =
            await request(app)
                .delete(
                    `/api/v1/roles/${tenantBRole.id}/permissions/${tenantBPermission.id}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                );

        expect(response.status).toBe(404);

        const assignment =
            await testPrisma.rolePermission.findUnique({
                where: {
                    roleId_permissionId: {
                        roleId: tenantBRole.id,
                        permissionId: tenantBPermission.id,
                    },
                },
            });

        expect(assignment).not.toBeNull();

    },
);

it(
"allows assigning a permission within the same tenant when the actor already holds that permission",
async () => {

    const tenantAUser =
        await createTestUser({
            permissions: [
                "roles.update",
                "roles.permissions.manage",
            ],
        });

    const role =
        await createRole(
            tenantAUser.tenant.id,
            `tenant-a-role-valid-assignment-${Date.now()}`,
        );

    const permission =
        await createPermission(
            tenantAUser.tenant.id,
            "roles.update",
        );

    const loginResponse =
        await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId:
                    tenantAUser.tenant.id,
                email:
                    tenantAUser.user.email,
                password:
                    tenantAUser.password,
            });

    expect(loginResponse.status).toBe(200);

    const accessToken =
        loginResponse.body.data.accessToken;

    const response =
        await request(app)
            .post(
                `/api/v1/roles/${role.id}/permissions/${permission.id}`,
            )
            .set(
                "Authorization",
                `Bearer ${accessToken}`,
            );

    expect(response.status).toBe(201);

    const assignment =
        await testPrisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            },
        });

    expect(assignment).not.toBeNull();

},
);


it(
    "cannot rename an existing permission into a privileged permission",
    async () => {

        const tenantAUser =
            await createTestUser({
                permissions: [
                    "permissions.update",
                ],
            });

        const permission =
            await createPermission(
                tenantAUser.tenant.id,
                "users.read",
            );

        const loginResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        tenantAUser.tenant.id,
                    email:
                        tenantAUser.user.email,
                    password:
                        tenantAUser.password,
                });

        expect(loginResponse.status).toBe(200);

        const accessToken =
            loginResponse.body.data.accessToken;

        const response =
            await request(app)
                .put(
                    `/api/v1/permissions/${permission.id}`,
                )
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    name: "roles.delete",
                    description: "Privilege escalation attempt",
                });

        expect(response.status).toBe(404);

        const persistedPermission =
            await testPrisma.permission.findUnique({
                where: {
                    id: permission.id,
                },
            });

        expect(
            persistedPermission?.name,
        ).toBe("users.read");

        expect(
            persistedPermission?.description,
        ).not.toBe(
            "Privilege escalation attempt",
        );
    },
);


it(
    "cannot create a privileged permission",
    async () => {

        const tenantAUser =
            await createTestUser({
                permissions: [
                    "permissions.create",
                ],
            });

        const loginResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        tenantAUser.tenant.id,
                    email:
                        tenantAUser.user.email,
                    password:
                        tenantAUser.password,
                });

        expect(loginResponse.status).toBe(200);

        const accessToken =
            loginResponse.body.data.accessToken;

        const response =
            await request(app)
                .post("/api/v1/permissions")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`,
                )
                .send({
                    name: "roles.delete",
                    description:
                        "Privilege escalation attempt",
                });

        expect(response.status).toBe(400);

        const persistedPermission =
            await testPrisma.permission.findFirst({
                where: {
                    tenantId:
                        tenantAUser.tenant.id,
                    name: "roles.delete",
                },
            });

        expect(
            persistedPermission,
        ).toBeNull();
    },
);
});


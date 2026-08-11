import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { createRole } from "../../factories/role.factory";
import { createPermission } from "../../factories/permission.factory";


describe("RBAC Tenant Isolation", () => {


    it(
        "denies a user from listing roles belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "roles.read",
                    ],
                });


            const tenantBUser =
                await createTestUser();


            await createRole(
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
            ).toBe(403);

        },
    );


    it(
        "denies a user from reading a role belonging to another tenant",
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
            ).toBe(403);

        },
    );


    it(
        "denies a user from listing permissions belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "permissions.read",
                    ],
                });


            const tenantBUser =
                await createTestUser();


            await createPermission(
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
            ).toBe(403);

        },
    );


    it(
        "denies a user from reading a permission belonging to another tenant",
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
            ).toBe(403);

        },
    );


    it(
        "denies a user from reading role permissions belonging to another tenant",
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
            ).toBe(403);

        },
    );


});

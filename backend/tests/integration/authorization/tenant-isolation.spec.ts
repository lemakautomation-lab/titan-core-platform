import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { createRole } from "../../factories/role.factory";

describe("Authorization Tenant Isolation", () => {

    it(
        "denies a user from reading users belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.read",
                    ],
                });


            const tenantBUser =
                await createTestUser();


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
                    .get("/api/v1/users")
                    .query({

                        tenantId:
                            tenantBUser.tenant.id,

                    })
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
        "denies a user from assigning a role to a user belonging to another tenant",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });


            const tenantBUser =
                await createTestUser();


            const role =
                await createRole(tenantBUser.tenant.id, `tenant-isolation-role-${Date.now()}`,
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
                    .post(
                        `/api/v1/users/${tenantBUser.user.id}/roles/${role.id}`,
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
        "denies a user from reading another tenant user by ID",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.read",
                    ],
                });


            const tenantBUser =
                await createTestUser();


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
                        `/api/v1/users/${tenantBUser.user.id}`,
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
        "denies a user from updating another tenant user",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });


            const tenantBUser =
                await createTestUser();


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
                    .put(
                        `/api/v1/users/${tenantBUser.user.id}`,
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({

                        organisationId: null,

                        email:
                            tenantBUser.user.email,

                        password:
                            null,

                        firstName:
                            "CrossTenantAttempt",

                        lastName:
                            tenantBUser.user.lastName ?? null,

                    });


            expect(
                response.status,
            ).toBe(403);

        },
    );


    it(
        "denies a user from deleting another tenant user",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.delete",
                    ],
                });


            const tenantBUser =
                await createTestUser();


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
                    .delete(
                        `/api/v1/users/${tenantBUser.user.id}`,
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
        "denies a user from removing a role from another tenant user",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.update",
                    ],
                });


            const tenantBUser =
                await createTestUser();


            const role =
                await createRole(tenantBUser.tenant.id, `tenant-isolation-remove-role-${Date.now()}`,
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
                    .delete(
                        `/api/v1/users/${tenantBUser.user.id}/roles/${role.id}`,
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
        "denies a user from creating a user in another tenant",
        async () => {
            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "users.create",
                    ],
                });
            const tenantBUser =
                await createTestUser();
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
                    .post("/api/v1/users")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    )
                    .send({
                        tenantId:
                            tenantBUser.tenant.id,
                        organisationId: null,
                        email:
                            `cross-tenant-create-${Date.now()}@example.com`,
                        password:
                            "TestPassword123!",
                        firstName:
                            "CrossTenant",
                        lastName:
                            "Attempt",
                    });
            expect(
                response.status,
            ).toBe(403);
        },
    );
});






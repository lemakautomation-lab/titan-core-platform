import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";


describe("Security Analytics Tenant Isolation", () => {


    beforeEach(async () => {

        await testPrisma.securityEvent.deleteMany({});

    });


    it(
        "allows an authenticated user with security.analytics.read to read their own tenant analytics",
        async () => {

            const user =
                await createTestUser({
                    permissions: [
                        "security.analytics.read",
                    ],
                });


            await testPrisma.securityEvent.createMany({

                data: [

                    {
                        tenantId:
                            user.tenant.id,

                        userId:
                            user.user.id,

                        eventType:
                            "AUTHENTICATION_FAILURE",

                        metadata: {
                            email:
                                user.user.email,
                        },
                    },

                    {
                        tenantId:
                            user.tenant.id,

                        userId:
                            user.user.id,

                        eventType:
                            "ACCOUNT_LOCKED",
                    },

                ],

            });


            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            user.tenant.id,

                        email:
                            user.user.email,

                        password:
                            user.password,
                    });


            expect(
                loginResponse.status,
            ).toBe(200);


            const accessToken =
                loginResponse.body.data.accessToken;


            const response =
                await request(app)
                    .get(
                        "/api/v1/security/analytics",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );


            expect(
                response.status,
            ).toBe(200);


            expect(
                response.body,
            ).toMatchObject({

                failedAttempts:
                    1,

                accountLockouts:
                    1,

                suspicious:
                    true,

                windowMinutes:
                    60,

            });

        },
    );


    it(
        "cannot query another tenant's security analytics",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "security.analytics.read",
                    ],
                });


            const tenantBUser =
                await createTestUser();


            await testPrisma.securityEvent.createMany({

                data: [

                    {
                        tenantId:
                            tenantAUser.tenant.id,

                        userId:
                            tenantAUser.user.id,

                        eventType:
                            "AUTHENTICATION_FAILURE",
                    },

                    {
                        tenantId:
                            tenantBUser.tenant.id,

                        userId:
                            tenantBUser.user.id,

                        eventType:
                            "AUTHENTICATION_FAILURE",
                    },

                    {
                        tenantId:
                            tenantBUser.tenant.id,

                        userId:
                            tenantBUser.user.id,

                        eventType:
                            "ACCOUNT_LOCKED",
                    },

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


            expect(
                loginResponse.status,
            ).toBe(200);


            const accessToken =
                loginResponse.body.data.accessToken;


            const response =
                await request(app)
                    .get(
                        "/api/v1/security/analytics",
                    )
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


            expect(
                response.body,
            ).toMatchObject({
                success:
                    false,

                error: {
                    code:
                        "FORBIDDEN",

                    message:
                        "Forbidden",
                },
            });

        },
    );


    it(
        "does not expose another tenant's security events in own-tenant analytics",
        async () => {

            const tenantAUser =
                await createTestUser({
                    permissions: [
                        "security.analytics.read",
                    ],
                });


            const tenantBUser =
                await createTestUser();


            await testPrisma.securityEvent.createMany({

                data: [

                    {
                        tenantId:
                            tenantAUser.tenant.id,

                        userId:
                            tenantAUser.user.id,

                        eventType:
                            "AUTHENTICATION_FAILURE",
                    },

                    {
                        tenantId:
                            tenantBUser.tenant.id,

                        userId:
                            tenantBUser.user.id,

                        eventType:
                            "AUTHENTICATION_FAILURE",
                    },

                    {
                        tenantId:
                            tenantBUser.tenant.id,

                        userId:
                            tenantBUser.user.id,

                        eventType:
                            "ACCOUNT_LOCKED",
                    },

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


            expect(
                loginResponse.status,
            ).toBe(200);


            const accessToken =
                loginResponse.body.data.accessToken;


            const response =
                await request(app)
                    .get(
                        "/api/v1/security/analytics",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );


            expect(
                response.status,
            ).toBe(200);


            expect(
                response.body.failedAttempts,
            ).toBe(1);


            expect(
                response.body.accountLockouts,
            ).toBe(0);

        },
    );


    it(
        "rejects access when security.analytics.read is not granted",
        async () => {

            const user =
                await createTestUser();


            const loginResponse =
                await request(app)
                    .post("/api/v1/auth/login")
                    .send({
                        tenantId:
                            user.tenant.id,

                        email:
                            user.user.email,

                        password:
                            user.password,
                    });


            expect(
                loginResponse.status,
            ).toBe(200);


            const accessToken =
                loginResponse.body.data.accessToken;


            const response =
                await request(app)
                    .get(
                        "/api/v1/security/analytics",
                    )
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`,
                    );


            expect(
                response.status,
            ).toBe(403);


            expect(
                response.body,
            ).toMatchObject({
                success:
                    false,

                error: {
                    code:
                        "FORBIDDEN",

                    message:
                        "Forbidden",
                },
            });

        },
    );


});

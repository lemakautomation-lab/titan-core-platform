import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";


describe("Authentication Login", () => {


    it("successfully authenticates a valid user and persists security event context", async () => {

        const { user, password } = await createTestUser();

        const requestId =
            `TITAN-041F-${crypto.randomUUID()}`;

        const userAgent =
            "TITAN-041F-INTEGRATION-TEST";


        const response = await request(app)
            .post("/api/v1/auth/login")
            .set("X-Request-Id", requestId)
            .set("User-Agent", userAgent)
            .send({
                tenantId: user.tenantId,
                email: user.email,
                password,
            });


        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();

        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();

        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(user.email);


        const sessions =
            await testPrisma.session.findMany({

                where: {
                    userId: user.id,
                },

            });


        expect(sessions).toHaveLength(1);


        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {
                    userId: user.id,
                    requestId,
                },

                orderBy: {
                    createdAt: "desc",
                },

            });


        expect(securityEvents).toHaveLength(1);


        const securityEvent =
            securityEvents[0];


        expect(securityEvent.eventType)
            .toBe("AUTHENTICATION_SUCCESS");

        expect(securityEvent.tenantId)
            .toBe(user.tenantId);

        expect(securityEvent.userId)
            .toBe(user.id);

        expect(securityEvent.userAgent)
            .toBe(userAgent);

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.ipAddress)
            .toBeDefined();

        expect(securityEvent.ipAddress)
            .not.toBeNull();


        const metadata =
            securityEvent.metadata as Record<string, unknown>;


        expect(metadata.email)
            .toBe(user.email);

    });



    it("rejects an invalid password and persists security event context", async () => {

        const { user } = await createTestUser();

        const requestId =
            `TITAN-041F-FAIL-${crypto.randomUUID()}`;

        const userAgent =
            "TITAN-041F-INVALID-PASSWORD";


        const response = await request(app)
            .post("/api/v1/auth/login")
            .set("X-Request-Id", requestId)
            .set("User-Agent", userAgent)
            .send({
                tenantId: user.tenantId,
                email: user.email,
                password: "WrongPassword123!",
            });


        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBeUndefined();


        const sessions =
            await testPrisma.session.findMany({

                where: {
                    userId: user.id,
                },

            });


        expect(sessions).toHaveLength(0);


        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {
                    userId: user.id,
                    requestId,
                },

                orderBy: {
                    createdAt: "desc",
                },

            });


        expect(securityEvents).toHaveLength(1);


        const securityEvent =
            securityEvents[0];


        expect(securityEvent.eventType)
            .toBe("AUTHENTICATION_FAILURE");

        expect(securityEvent.tenantId)
            .toBe(user.tenantId);

        expect(securityEvent.userId)
            .toBe(user.id);

        expect(securityEvent.userAgent)
            .toBe(userAgent);

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.ipAddress)
            .toBeDefined();

        expect(securityEvent.ipAddress)
            .not.toBeNull();


        const metadata =
            securityEvent.metadata as Record<string, unknown>;


        expect(metadata.email)
            .toBe(user.email);

        expect(metadata.reason)
            .toBe("INVALID_PASSWORD");

    });



    it("rejects an unknown user and persists anonymous security event context", async () => {

        const requestId =
            `TITAN-041F-UNKNOWN-${crypto.randomUUID()}`;

        const userAgent =
            "TITAN-041F-UNKNOWN-USER";


        const response = await request(app)
            .post("/api/v1/auth/login")
            .set("X-Request-Id", requestId)
            .set("User-Agent", userAgent)
            .send({
                tenantId: crypto.randomUUID(),
                email: "unknown@titan.test",
                password: "Password123!",
            });


        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBeUndefined();


        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {
                    requestId,
                },

            });


        expect(securityEvents).toHaveLength(1);


        const securityEvent =
            securityEvents[0];


        expect(securityEvent.eventType)
            .toBe("AUTHENTICATION_FAILURE");

        expect(securityEvent.tenantId)
            .not.toBeNull();

        expect(securityEvent.userId)
            .toBeNull();

        expect(securityEvent.userAgent)
            .toBe(userAgent);

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.ipAddress)
            .toBeDefined();

        expect(securityEvent.ipAddress)
            .not.toBeNull();


        const metadata =
            securityEvent.metadata as Record<string, unknown>;


        expect(metadata.email)
            .toBe("unknown@titan.test");

        expect(metadata.reason)
            .toBe("USER_NOT_FOUND");

    });



    it("rejects an invalid tenant and persists security event context", async () => {

        const { user, password } = await createTestUser();

        const requestId =
            `TITAN-041F-TENANT-${crypto.randomUUID()}`;

        const userAgent =
            "TITAN-041F-TENANT-MISMATCH";


        const response = await request(app)
            .post("/api/v1/auth/login")
            .set("X-Request-Id", requestId)
            .set("User-Agent", userAgent)
            .send({
                tenantId: crypto.randomUUID(),
                email: user.email,
                password,
            });


        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBeUndefined();


        const sessions =
            await testPrisma.session.findMany({

                where: {
                    userId: user.id,
                },

            });


        expect(sessions).toHaveLength(0);


        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {
                    userId: user.id,
                    requestId,
                },

            });


        expect(securityEvents).toHaveLength(1);


        const securityEvent =
            securityEvents[0];


        expect(securityEvent.eventType)
            .toBe("AUTHENTICATION_FAILURE");

        expect(securityEvent.userId)
            .toBe(user.id);

        expect(securityEvent.userAgent)
            .toBe(userAgent);

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.ipAddress)
            .toBeDefined();

        expect(securityEvent.ipAddress)
            .not.toBeNull();


        const metadata =
            securityEvent.metadata as Record<string, unknown>;


        expect(metadata.email)
            .toBe(user.email);

        expect(metadata.reason)
            .toBe("TENANT_MISMATCH");

    });



    it("locks account after failed login threshold and persists lock event", async () => {

        const { user, password } = await createTestUser();


        const requestId =
            `TITAN-042A-LOCK-${crypto.randomUUID()}`;


        const userAgent =
            "TITAN-042A-ACCOUNT-LOCK-TEST";


        for (let attempt = 0; attempt < 5; attempt++) {

            await request(app)
                .post("/api/v1/auth/login")
                .set("X-Request-Id", `${requestId}-${attempt}`)
                .set("User-Agent", userAgent)
                .send({

                    tenantId: user.tenantId,

                    email: user.email,

                    password: "WrongPassword123!",

                });

        }


        const lockedResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .set("X-Request-Id", requestId)
                .set("User-Agent", userAgent)
                .send({

                    tenantId: user.tenantId,

                    email: user.email,

                    password: "WrongPassword123!",

                });


        expect(lockedResponse.status)
            .toBe(401);



        const userRecord =
            await testPrisma.user.findUnique({

                where: {
                    id: user.id,
                },

            });


        expect(userRecord?.status)
            .toBe("LOCKED");



        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {

                    userId: user.id,

                    eventType: "ACCOUNT_LOCKED",

                },

            });


        expect(securityEvents.length)
            .toBeGreaterThanOrEqual(1);



        const securityEvent =
            securityEvents[
                securityEvents.length - 1
            ];


        expect(securityEvent.userId)
            .toBe(user.id);


        expect(securityEvent.userAgent)
            .toBe(userAgent);


        expect(securityEvent.requestId)
            .toBe(requestId);


        expect(securityEvent.ipAddress)
            .toBeDefined();


    });


});

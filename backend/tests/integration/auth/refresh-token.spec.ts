import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";
import { jwtService } from "../../../src/security/jwt";

describe("Refresh Token", () => {

    it("rotates a valid refresh token and preserves authorization context in the new access token", async () => {

        const {
            user,
            password,
        } = await createTestUser();

        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: user.tenantId,
                    email: user.email,
                    password,
                });

        expect(login.status).toBe(200);

        const setCookie =
            login.headers["set-cookie"];

        expect(setCookie)
            .toBeDefined();

        expect(setCookie.length)
            .toBeGreaterThan(0);

        const originalRefreshCookie =
            setCookie.find(
                (cookie: string) =>
                    cookie.toLowerCase().startsWith("titan_refresh_token="),
            );

        expect(originalRefreshCookie)
            .toBeDefined();

        const originalAccess =
            login.body.data.accessToken;

        const originalPayload =
            jwtService.verifyAccessToken(
                originalAccess,
            );

        const refreshCookieValue =
            originalRefreshCookie!
                .split(";")[0];

        const originalRefresh =
            refreshCookieValue
                .substring(
                    refreshCookieValue.indexOf("=") + 1,
                );

        const originalSession =
            await testPrisma.session.findUnique({
                where: {
                    refreshToken: originalRefresh,
                },
            });

        expect(originalSession)
            .toBeDefined();

        const requestId =
            crypto.randomUUID();

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "User-Agent",
                    "Refresh-Test-Agent",
                )
                .set(
                    "X-Request-Id",
                    requestId,
                )
                .set(
                    "Cookie",
                    originalRefreshCookie!,
                );

        expect(response.status)
            .toBe(200);

        expect(response.body.success)
            .toBe(true);

        expect(
            response.body.data.accessToken,
        ).toBeDefined();

        expect(
            response.body.data.refreshToken,
        ).toBeUndefined();

        const rotatedCookies =
            response.headers["set-cookie"];

        expect(rotatedCookies)
            .toBeDefined();

        expect(rotatedCookies.length)
            .toBeGreaterThan(0);

        const rotatedRefreshCookie =
            rotatedCookies.find(
                (cookie: string) =>
                    cookie.toLowerCase().startsWith("titan_refresh_token="),
            );

        expect(rotatedRefreshCookie)
            .toBeDefined();

        expect(rotatedRefreshCookie)
            .not.toBe(originalRefreshCookie);

        const refreshedPayload =
            jwtService.verifyAccessToken(
                response.body.data.accessToken,
            );

        expect(refreshedPayload.userId)
            .toBe(user.id);

        expect(refreshedPayload.tenantId)
            .toBe(user.tenantId);

        expect(refreshedPayload.roles)
            .toEqual(originalPayload.roles);

        const activeSessions =
            await testPrisma.session.findMany({
                where: {
                    userId: user.id,
                    status: "ACTIVE",
                },
            });

        const revokedSessions =
            await testPrisma.session.findMany({
                where: {
                    userId: user.id,
                    status: "REVOKED",
                },
            });

        expect(activeSessions.length)
            .toBe(1);

        expect(revokedSessions.length)
            .toBe(1);

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    userId: user.id,
                    eventType: "TOKEN_REFRESH_SUCCESS",
                    requestId,
                },
            });

        expect(securityEvents.length)
            .toBe(1);

        const securityEvent =
            securityEvents[0];

        expect(securityEvent.userId)
            .toBe(user.id);

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.metadata)
            .toBeDefined();

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.previousSessionId)
            .toBe(originalSession!.id);

        expect(metadata.newSessionId)
            .toBe(activeSessions[0].id);

        expect(securityEvent.userAgent)
            .toBe("Refresh-Test-Agent");

    });


    it("rejects reuse of a rotated refresh token and records token reuse", async () => {

        const {
            user,
            password,
        } = await createTestUser();

        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: user.tenantId,
                    email: user.email,
                    password,
                });

        expect(login.status)
            .toBe(200);

        const setCookie =
            login.headers["set-cookie"];

        expect(setCookie)
            .toBeDefined();

        expect(setCookie.length)
            .toBeGreaterThan(0);

        const originalRefreshCookie =
            setCookie.find(
                (cookie: string) =>
                    cookie.toLowerCase().startsWith("titan_refresh_token="),
            );

        expect(originalRefreshCookie)
            .toBeDefined();

        const originalRefresh =
            originalRefreshCookie!
                .split(";")[0];

        const rotationRequestId =
            crypto.randomUUID();

        const rotation =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "X-Request-Id",
                    rotationRequestId,
                )
                .set(
                    "Cookie",
                    originalRefreshCookie!,
                );

        expect(rotation.status)
            .toBe(200);

        expect(
            rotation.body.data.accessToken,
        ).toBeDefined();

        const rotatedCookies =
            rotation.headers["set-cookie"];

        expect(rotatedCookies)
            .toBeDefined();

        expect(rotatedCookies.length)
            .toBeGreaterThan(0);

        const rotatedRefreshCookie =
            rotatedCookies.find(
                (cookie: string) =>
                    cookie.toLowerCase().startsWith("titan_refresh_token="),
            );

        expect(rotatedRefreshCookie)
            .toBeDefined();

        expect(rotatedRefreshCookie)
            .not.toBe(originalRefreshCookie);

        const replayRequestId =
            crypto.randomUUID();

        const replay =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "X-Request-Id",
                    replayRequestId,
                )
                .set(
                    "Cookie",
                    originalRefreshCookie!,
                );

        expect(replay.status)
            .toBe(401);

        expect(replay.body.success)
            .toBe(false);

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    userId: user.id,
                    eventType: "TOKEN_REUSE_DETECTED",
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        expect(securityEvents.length)
            .toBeGreaterThanOrEqual(1);

        const securityEvent =
            securityEvents[0];

        expect(securityEvent.userId)
            .toBe(user.id);

        expect(securityEvent.metadata)
            .toBeDefined();

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.reason)
            .toBe("REVOKED_REFRESH_TOKEN_REUSE");

        expect(metadata.sessionId)
            .toBeDefined();

    });


    it("rejects a refresh token whose JWT user does not match the persisted session", async () => {

        const {
            user: sessionUser,
        } = await createTestUser();

        const {
            user: tokenUser,
        } = await createTestUser();

        const refreshToken =
            jwtService.generateRefreshToken({
                userId: tokenUser.id,
            });

        const session =
            await testPrisma.session.create({
                data: {
                    userId: sessionUser.id,
                    refreshToken: refreshToken.token,
                    jti: crypto.randomUUID(),
                    status: "ACTIVE",
                    expiresAt:
                        new Date(
                            Date.now() +
                            7 * 24 * 60 * 60 * 1000,
                        ),
                },
            });

        const requestId =
            crypto.randomUUID();

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "User-Agent",
                    "Token-Mismatch-Test-Agent",
                )
                .set(
                    "X-Request-Id",
                    requestId,
                )
                .set(
                    "Cookie",
                    `titan_refresh_token=${refreshToken.token}`,
                );

        expect(response.status)
            .toBe(401);

        expect(response.body.success)
            .toBe(false);

        const unchangedSession =
            await testPrisma.session.findUnique({
                where: {
                    id: session.id,
                },
            });

        expect(unchangedSession?.status)
            .toBe("ACTIVE");

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    eventType:
                        "TOKEN_REFRESH_FAILURE",
                    requestId,
                },
            });

        expect(securityEvents)
            .toHaveLength(1);

        const securityEvent =
            securityEvents[0];

        expect(securityEvent.userId)
            .toBeNull();

        expect(securityEvent.tenantId)
            .toBeNull();

        expect(securityEvent.userAgent)
            .toBe(
                "Token-Mismatch-Test-Agent",
            );

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.metadata)
            .toBeDefined();

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.reason)
            .toBe("TOKEN_USER_MISMATCH");

        expect(metadata.sessionId)
            .toBe(session.id);

    });


    it("rejects a refresh token whose JWT JTI does not match the persisted session", async () => {

        const {
            user,
        } = await createTestUser();

        const generated =
            jwtService.generateRefreshToken({
                userId: user.id,
            });

        const session =
            await testPrisma.session.create({
                data: {
                    userId: user.id,
                    refreshToken: generated.token,
                    jti: crypto.randomUUID(),
                    status: "ACTIVE",
                    expiresAt:
                        new Date(
                            Date.now() +
                            7 * 24 * 60 * 60 * 1000,
                        ),
                },
            });

        expect(session.jti)
            .not.toBe(generated.jti);

        const requestId =
            crypto.randomUUID();

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "User-Agent",
                    "JTI-Mismatch-Test-Agent",
                )
                .set(
                    "X-Request-Id",
                    requestId,
                )
                .set(
                    "Cookie",
                    `titan_refresh_token=${generated.token}`,
                );

        expect(response.status)
            .toBe(401);

        expect(response.body.success)
            .toBe(false);

        const unchangedSession =
            await testPrisma.session.findUnique({
                where: {
                    id: session.id,
                },
            });

        expect(unchangedSession?.status)
            .toBe("ACTIVE");

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    eventType:
                        "TOKEN_REFRESH_FAILURE",
                    requestId,
                },
            });

        expect(securityEvents)
            .toHaveLength(1);

        const securityEvent =
            securityEvents[0];

        expect(securityEvent.userId)
            .toBe(user.id);

        expect(securityEvent.tenantId)
            .toBe(user.tenantId);

        expect(securityEvent.userAgent)
            .toBe(
                "JTI-Mismatch-Test-Agent",
            );

        expect(securityEvent.requestId)
            .toBe(requestId);

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.reason)
            .toBe("TOKEN_JTI_MISMATCH");

        expect(metadata.sessionId)
            .toBe(session.id);

        expect(metadata.userId)
            .toBe(user.id);

    });

    it("rejects an invalid refresh token and records refresh failure", async () => {

        const requestId =
            crypto.randomUUID();

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "User-Agent",
                    "Invalid-Refresh-Test-Agent",
                )
                .set(
                    "X-Request-Id",
                    requestId,
                )
                .set(
                    "Cookie",
                    "titan_refresh_token=invalid-token",
                );

        expect(response.status)
            .toBe(401);

        expect(response.body.success)
            .toBe(false);

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    eventType:
                        "TOKEN_REFRESH_FAILURE",

                    requestId,
                },
            });

        expect(securityEvents)
            .toHaveLength(1);

        const securityEvent =
            securityEvents[0];

        expect(securityEvent.userId)
            .toBeNull();

        expect(securityEvent.tenantId)
            .toBeNull();

        expect(securityEvent.userAgent)
            .toBe(
                "Invalid-Refresh-Test-Agent",
            );

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.metadata)
            .toBeDefined();

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.reason)
            .toBe("INVALID_REFRESH_TOKEN");

    });
    it("atomically rotates a refresh token under concurrent reuse and creates exactly one successor session", async () => {

        const {
            user,
            password,
        } = await createTestUser();

        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: user.tenantId,
                    email: user.email,
                    password,
                });

        expect(login.status)
            .toBe(200);

        const setCookie =
            login.headers["set-cookie"];

        expect(setCookie)
            .toBeDefined();

        expect(setCookie.length)
            .toBeGreaterThan(0);

        const originalRefreshCookie =
            setCookie.find(
                (cookie: string) =>
                    cookie.toLowerCase().startsWith("titan_refresh_token="),
            );

        expect(originalRefreshCookie)
            .toBeDefined();

        const originalRefresh =
            originalRefreshCookie!
                .split(";")[0];

        const originalSession =
            await testPrisma.session.findUnique({
                where: {
                    refreshToken:
                        originalRefresh.substring(
                            originalRefresh.indexOf("=") + 1,
                        ),
                },
            });

        expect(originalSession)
            .toBeDefined();

        expect(originalSession!.status)
            .toBe("ACTIVE");


        const requestIdA =
            crypto.randomUUID();

        const requestIdB =
            crypto.randomUUID();


        const [responseA, responseB] =
            await Promise.all([

                request(app)
                    .post("/api/v1/auth/refresh")
                    .set(
                        "X-Request-Id",
                        requestIdA,
                    )
                    .set(
                        "User-Agent",
                        "Concurrent-Refresh-A",
                    )
                    .set(
                        "Cookie",
                        originalRefreshCookie!,
                    ),

                request(app)
                    .post("/api/v1/auth/refresh")
                    .set(
                        "X-Request-Id",
                        requestIdB,
                    )
                    .set(
                        "User-Agent",
                        "Concurrent-Refresh-B",
                    )
                    .set(
                        "Cookie",
                        originalRefreshCookie!,
                    ),

            ]);


        const responses = [
            responseA,
            responseB,
        ];


        const successfulResponses =
            responses.filter(
                response =>
                    response.status === 200,
            );

        const rejectedResponses =
            responses.filter(
                response =>
                    response.status === 401,
            );


        expect(successfulResponses)
            .toHaveLength(1);

        expect(rejectedResponses)
            .toHaveLength(1);


        expect(successfulResponses[0].body.success)
            .toBe(true);

        expect(
            successfulResponses[0].body.data.accessToken,
        ).toBeDefined();


        expect(rejectedResponses[0].body.success)
            .toBe(false);


        const activeSessions =
            await testPrisma.session.findMany({
                where: {
                    userId: user.id,
                    status: "ACTIVE",
                },
            });

        const revokedSessions =
            await testPrisma.session.findMany({
                where: {
                    userId: user.id,
                    status: "REVOKED",
                },
            });


        expect(activeSessions)
            .toHaveLength(1);

        expect(revokedSessions)
            .toHaveLength(1);


        expect(revokedSessions[0].id)
            .toBe(originalSession!.id);

        expect(activeSessions[0].id)
            .not.toBe(originalSession!.id);


        const refreshSuccessEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    userId: user.id,
                    eventType: "TOKEN_REFRESH_SUCCESS",
                    requestId: {
                        in: [
                            requestIdA,
                            requestIdB,
                        ],
                    },
                },
            });


        expect(refreshSuccessEvents)
            .toHaveLength(1);


        const reuseEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    userId: user.id,
                    eventType: "TOKEN_REUSE_DETECTED",
                    requestId: {
                        in: [
                            requestIdA,
                            requestIdB,
                        ],
                    },
                },
            });


        expect(reuseEvents)
            .toHaveLength(1);


        const reuseMetadata =
            reuseEvents[0].metadata as Record<string, unknown>;


        expect(reuseMetadata.reason)
            .toBe("REVOKED_REFRESH_TOKEN_REUSE");

        expect(reuseMetadata.sessionId)
            .toBe(originalSession!.id);


        const successorRefreshToken =
            activeSessions[0].refreshToken;


        expect(successorRefreshToken)
            .not.toBe(
                originalSession!.refreshToken,
            );


        const allUserSessions =
            await testPrisma.session.findMany({
                where: {
                    userId: user.id,
                },
            });


        expect(allUserSessions)
            .toHaveLength(2);

    });
});






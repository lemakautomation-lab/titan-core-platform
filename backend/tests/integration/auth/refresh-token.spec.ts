import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";
import { jwtService } from "../../../src/security/jwt";

describe("Refresh Token", () => {

    it("rotates a valid refresh token and records a success security event", async () => {

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

        const originalRefresh =
            login.body.data.refreshToken;

        const originalSession =
            await testPrisma.session.findUnique({
                where: {
                    refreshToken: originalRefresh,
                },
            });

        expect(originalSession).toBeDefined();

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set("User-Agent", "Refresh-Test-Agent")
                .send({
                    refreshToken: originalRefresh,
                });

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(true);

        expect(
            response.body.data.accessToken,
        ).toBeDefined();

        expect(
            response.body.data.refreshToken,
        ).toBeDefined();

        expect(
            response.body.data.refreshToken,
        ).not.toBe(originalRefresh);

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

        expect(activeSessions.length).toBe(1);
        expect(revokedSessions.length).toBe(1);

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    userId: user.id,
                    eventType: "TOKEN_REFRESH_SUCCESS",
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

        expect(login.status).toBe(200);

        const originalRefresh =
            login.body.data.refreshToken;

        const rotation =
            await request(app)
                .post("/api/v1/auth/refresh")
                .send({
                    refreshToken: originalRefresh,
                });

        expect(rotation.status).toBe(200);

        expect(
            rotation.body.data.refreshToken,
        ).toBeDefined();

        expect(
            rotation.body.data.refreshToken,
        ).not.toBe(originalRefresh);

        const replay =
            await request(app)
                .post("/api/v1/auth/refresh")
                .send({
                    refreshToken: originalRefresh,
                });

        expect(replay.status).toBe(401);

        expect(replay.body.success).toBe(false);

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
                    refreshToken,
                    status: "ACTIVE",
                    expiresAt:
                        new Date(
                            Date.now() +
                            7 * 24 * 60 * 60 * 1000,
                        ),
                },
            });

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set("User-Agent", "Token-Mismatch-Test-Agent")
                .send({
                    refreshToken,
                });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);

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
                    eventType: "TOKEN_REFRESH_FAILURE",
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        const securityEvent =
            securityEvents[0];

        expect(securityEvent.userId)
            .toBeNull();

        expect(securityEvent.userAgent)
            .toBe("Token-Mismatch-Test-Agent");

        expect(securityEvent.metadata)
            .toBeDefined();

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.reason)
            .toBe("TOKEN_USER_MISMATCH");

        expect(metadata.sessionId)
            .toBe(session.id);

    });
    it("rejects an invalid refresh token and records refresh failure", async () => {

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set("User-Agent", "Invalid-Refresh-Test-Agent")
                .send({
                    refreshToken: "invalid-token",
                });

        expect(response.status).toBe(401);

        expect(response.body.success).toBe(false);

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    eventType: "TOKEN_REFRESH_FAILURE",
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
            .toBeNull();

        expect(securityEvent.tenantId)
            .toBeNull();

        expect(securityEvent.userAgent)
            .toBe("Invalid-Refresh-Test-Agent");

        expect(securityEvent.metadata)
            .toBeDefined();

        const metadata =
            securityEvent.metadata as Record<string, unknown>;

        expect(metadata.reason)
            .toBe("INVALID_REFRESH_TOKEN");

    });

});


import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";


describe("Logout Session Authorization", () => {


    it("allows a user to revoke their own session", async () => {

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

        const refreshToken =
            login.body.data.refreshToken;

        const session =
            await testPrisma.session.findUnique({
                where: {
                    refreshToken,
                },
            });

        expect(session).not.toBeNull();

        const logout =
            await request(app)
                .post("/api/v1/auth/logout")
                .set(
                    "Authorization",
                    `Bearer ${login.body.data.accessToken}`,
                )
                .set(
                    "User-Agent",
                    "Logout-Test-Agent",
                )
                .send({
                    sessionId: session!.id,
                });

        expect(logout.status).toBe(200);

        const revoked =
            await testPrisma.session.findUnique({
                where: {
                    id: session!.id,
                },
            });

        expect(revoked!.status).toBe("REVOKED");

        const securityEvents =
            await testPrisma.securityEvent.findMany({
                where: {
                    userId: user.id,
                    eventType: "SESSION_REVOKED",
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

        expect(metadata.sessionId)
            .toBe(session!.id);

        expect(securityEvent.userAgent)
            .toBe("Logout-Test-Agent");

    });


    it("rejects logout of another user's session", async () => {

        const first =
            await createTestUser();

        const second =
            await createTestUser();

        const firstLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: first.user.tenantId,
                    email: first.user.email,
                    password: first.password,
                });

        expect(firstLogin.status).toBe(200);

        const secondLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: second.user.tenantId,
                    email: second.user.email,
                    password: second.password,
                });

        expect(secondLogin.status).toBe(200);

        const secondSession =
            await testPrisma.session.findUnique({
                where: {
                    refreshToken:
                        secondLogin.body.data.refreshToken,
                },
            });

        expect(secondSession).not.toBeNull();

        const logout =
            await request(app)
                .post("/api/v1/auth/logout")
                .set(
                    "Authorization",
                    `Bearer ${firstLogin.body.data.accessToken}`,
                )
                .send({
                    sessionId: secondSession!.id,
                });

        expect(logout.status).toBe(401);

        const unchanged =
            await testPrisma.session.findUnique({
                where: {
                    id: secondSession!.id,
                },
            });

        expect(unchanged!.status).toBe("ACTIVE");

    });


    it("blocks cross-tenant logout", async () => {

        const first =
            await createTestUser();

        const second =
            await createTestUser();

        expect(first.user.tenantId)
            .not.toBe(second.user.tenantId);

        const firstLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: first.user.tenantId,
                    email: first.user.email,
                    password: first.password,
                });

        expect(firstLogin.status).toBe(200);

        const secondLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: second.user.tenantId,
                    email: second.user.email,
                    password: second.password,
                });

        expect(secondLogin.status).toBe(200);

        const secondSession =
            await testPrisma.session.findUnique({
                where: {
                    refreshToken:
                        secondLogin.body.data.refreshToken,
                },
            });

        expect(secondSession).not.toBeNull();

        const logout =
            await request(app)
                .post("/api/v1/auth/logout")
                .set(
                    "Authorization",
                    `Bearer ${firstLogin.body.data.accessToken}`,
                )
                .send({
                    sessionId: secondSession!.id,
                });

        expect(logout.status).toBe(401);

        const unchanged =
            await testPrisma.session.findUnique({
                where: {
                    id: secondSession!.id,
                },
            });

        expect(unchanged!.status).toBe("ACTIVE");

    });


    it("rejects logout without authentication", async () => {

        const response =
            await request(app)
                .post("/api/v1/auth/logout")
                .send({
                    sessionId:
                        "00000000-0000-0000-0000-000000000000",
                });

        expect(response.status).toBe(401);

    });

});

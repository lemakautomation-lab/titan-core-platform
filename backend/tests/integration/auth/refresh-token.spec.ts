import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

describe("Refresh Token", () => {

    it("rotates a valid refresh token", async () => {

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

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .send({
                    refreshToken: originalRefresh,
                });

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(true);

        expect(
            response.body.data.accessToken
        ).toBeDefined();

        expect(
            response.body.data.refreshToken
        ).toBeDefined();

        expect(
            response.body.data.refreshToken
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

    });

    it("rejects reuse of a rotated refresh token", async () => {

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
            rotation.body.data.refreshToken
        ).toBeDefined();

        expect(
            rotation.body.data.refreshToken
        ).not.toBe(originalRefresh);

        const replay =
            await request(app)
                .post("/api/v1/auth/refresh")
                .send({
                    refreshToken: originalRefresh,
                });

        expect(replay.status).toBe(401);

        expect(replay.body.success).toBe(false);

    });

    it("rejects an invalid refresh token", async () => {

        const response =
            await request(app)
                .post("/api/v1/auth/refresh")
                .send({
                    refreshToken: "invalid-token",
                });

        expect(response.status).toBe(401);

        expect(response.body.success).toBe(false);

    });

});

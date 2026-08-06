import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";

describe("Authentication Login", () => {

    it("successfully authenticates a valid user", async () => {

        const { user, password } = await createTestUser();

        const response = await request(app)
            .post("/api/v1/auth/login")
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

        const sessions = await testPrisma.session.findMany({
            where: {
                userId: user.id,
            },
        });

        expect(sessions).toHaveLength(1);
    });

    it("rejects an invalid password", async () => {

        const { user } = await createTestUser();

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId: user.tenantId,
                email: user.email,
                password: "WrongPassword123!",
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBeUndefined();

        const sessions = await testPrisma.session.findMany({
            where: {
                userId: user.id,
            },
        });

        expect(sessions).toHaveLength(0);
    });

    it("rejects an unknown user", async () => {

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId: crypto.randomUUID(),
                email: "unknown@titan.test",
                password: "Password123!",
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBeUndefined();
    });

    it("rejects an invalid tenant", async () => {

        const { user, password } = await createTestUser();

        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                tenantId: crypto.randomUUID(),
                email: user.email,
                password,
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.data).toBeUndefined();

        const sessions = await testPrisma.session.findMany({
            where: {
                userId: user.id,
            },
        });

        expect(sessions).toHaveLength(0);
    });

});

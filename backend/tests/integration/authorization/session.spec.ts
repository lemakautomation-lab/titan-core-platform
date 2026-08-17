import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { assignPermissions } from "../../factories/rbac.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

describe("Session Authorization", () => {

    it("allows sessions.read to read a session in the authenticated tenant", async () => {

        const { user, password } =
            await createTestUser();

        await assignPermissions(
            user.id,
            ["sessions.read"],
        );

        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: user.tenantId,
                    email: user.email,
                    password,
                });

        expect(login.status).toBe(200);

        const refreshCookie =
            login.headers["set-cookie"]
                .find((cookie: string) =>
                    cookie
                        .toLowerCase()
                        .startsWith("titan_refresh_token="),
                );

        expect(refreshCookie).toBeDefined();

        const refreshToken =
            refreshCookie!
                .split(";")[0]
                .split("=")[1];

        const session =
            await testPrisma.session.findUnique({
                where: { refreshToken },
            });

        expect(session).not.toBeNull();

        const response =
            await request(app)
                .get(`/api/v1/sessions/${session!.id}`)
                .set(
                    "Authorization",
                    `Bearer ${login.body.data.accessToken}`,
                );

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(session!.id);
    });


    it("cannot read a session belonging to another tenant", async () => {

        const first =
            await createTestUser();

        const second =
            await createTestUser();

        await assignPermissions(
            first.user.id,
            ["sessions.read"],
        );

        const secondLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: second.user.tenantId,
                    email: second.user.email,
                    password: second.password,
                });

        expect(secondLogin.status).toBe(200);

        const refreshCookie =
            secondLogin.headers["set-cookie"]
                .find((cookie: string) =>
                    cookie
                        .toLowerCase()
                        .startsWith("titan_refresh_token="),
                );

        const refreshToken =
            refreshCookie!
                .split(";")[0]
                .split("=")[1];

        const session =
            await testPrisma.session.findUnique({
                where: { refreshToken },
            });

        expect(session).not.toBeNull();

        const firstLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: first.user.tenantId,
                    email: first.user.email,
                    password: first.password,
                });

        expect(firstLogin.status).toBe(200);

        const response =
            await request(app)
                .get(`/api/v1/sessions/${session!.id}`)
                .set(
                    "Authorization",
                    `Bearer ${firstLogin.body.data.accessToken}`,
                );

        expect(response.status).toBe(404);
    });


    it("rejects a user without sessions.read", async () => {

        const { user, password } =
            await createTestUser();

        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId: user.tenantId,
                    email: user.email,
                    password,
                });

        expect(login.status).toBe(200);

        const refreshCookie =
            login.headers["set-cookie"]
                .find((cookie: string) =>
                    cookie
                        .toLowerCase()
                        .startsWith("titan_refresh_token="),
                );

        const refreshToken =
            refreshCookie!
                .split(";")[0]
                .split("=")[1];

        const session =
            await testPrisma.session.findUnique({
                where: { refreshToken },
            });

        expect(session).not.toBeNull();

        const response =
            await request(app)
                .get(`/api/v1/sessions/${session!.id}`)
                .set(
                    "Authorization",
                    `Bearer ${login.body.data.accessToken}`,
                );

        expect(response.status).toBe(403);
    });


    it("rejects an unauthenticated session request", async () => {

        const { user } =
            await createTestUser();

        const session =
            await testPrisma.session.findFirst({
                where: {
                    userId: user.id,
                },
            });

        expect(session).toBeNull();

        const response =
            await request(app)
                .get(`/api/v1/sessions/non-existent-session`);

        expect(response.status).toBe(401);
    });

});

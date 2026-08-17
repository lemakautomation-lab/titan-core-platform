import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";


const REFRESH_TOKEN_COOKIE_NAME =
    "titan_refresh_token";


function extractRefreshToken(
    setCookie: string[] | undefined,
): string {

    expect(setCookie)
        .toBeDefined();

    expect(setCookie!.length)
        .toBeGreaterThan(0);

    const refreshCookie =
        setCookie!.find(
            (cookie: string) =>
                cookie
                    .toLowerCase()
                    .startsWith(
                        `${REFRESH_TOKEN_COOKIE_NAME}=`,
                    ),
        );

    expect(refreshCookie)
        .toBeDefined();

    const cookieValue =
        refreshCookie!
            .split(";")[0];

    return cookieValue.substring(
        cookieValue.indexOf("=") + 1,
    );

}


describe("Logout Session Authorization", () => {


    it("allows a user to revoke their own session using the HttpOnly refresh cookie", async () => {

        const {
            user,
            password,
        } = await createTestUser();


        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        user.tenantId,

                    email:
                        user.email,

                    password,
                });


        expect(login.status)
            .toBe(200);


        const refreshCookie =
            login.headers["set-cookie"]?.find(
                (cookie: string) =>
                    cookie
                        .toLowerCase()
                        .startsWith(
                            `${REFRESH_TOKEN_COOKIE_NAME}=`,
                        ),
            );


        expect(refreshCookie)
            .toBeDefined();


        const refreshToken =
            extractRefreshToken(
                login.headers["set-cookie"],
            );


        const session =
            await testPrisma.session.findUnique({

                where: {
                    refreshToken,
                },

            });


        expect(session)
            .not.toBeNull();


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
                .set(
                    "Cookie",
                    refreshCookie!,
                );


        expect(logout.status)
            .toBe(200);


        expect(logout.body.success)
            .toBe(true);


        const revoked =
            await testPrisma.session.findUnique({

                where: {
                    id:
                        session!.id,
                },

            });


        expect(revoked!.status)
            .toBe("REVOKED");


        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {
                    userId:
                        user.id,

                    eventType:
                        "SESSION_REVOKED",
                },

                orderBy: {
                    createdAt:
                        "desc",
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
            securityEvent.metadata as Record<
                string,
                unknown
            >;


        expect(metadata.sessionId)
            .toBe(session!.id);


        expect(securityEvent.userAgent)
            .toBe("Logout-Test-Agent");

    });


    it("rejects logout when the refresh cookie is missing", async () => {

        const {
            user,
            password,
        } = await createTestUser();


        const login =
            await request(app)
                .post("/api/v1/auth/login")
                .send({
                    tenantId:
                        user.tenantId,

                    email:
                        user.email,

                    password,
                });


        expect(login.status)
            .toBe(200);


        const logout =
            await request(app)
                .post("/api/v1/auth/logout")
                .set(
                    "Authorization",
                    `Bearer ${login.body.data.accessToken}`,
                );


        expect(logout.status)
            .toBe(401);

    });


    it("rejects logout when the refresh cookie belongs to another user", async () => {

        const first =
            await createTestUser();


        const second =
            await createTestUser();


        const firstLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({

                    tenantId:
                        first.user.tenantId,

                    email:
                        first.user.email,

                    password:
                        first.password,

                });


        expect(firstLogin.status)
            .toBe(200);


        const secondLogin =
            await request(app)
                .post("/api/v1/auth/login")
                .send({

                    tenantId:
                        second.user.tenantId,

                    email:
                        second.user.email,

                    password:
                        second.password,

                });


        expect(secondLogin.status)
            .toBe(200);


        const secondCookie =
            secondLogin.headers["set-cookie"]?.find(
                (cookie: string) =>
                    cookie
                        .toLowerCase()
                        .startsWith(
                            `${REFRESH_TOKEN_COOKIE_NAME}=`,
                        ),
            );


        expect(secondCookie)
            .toBeDefined();


        const secondRefreshToken =
            extractRefreshToken(
                secondLogin.headers["set-cookie"],
            );


        const secondSession =
            await testPrisma.session.findUnique({

                where: {
                    refreshToken:
                        secondRefreshToken,
                },

            });


        expect(secondSession)
            .not.toBeNull();


        const logout =
            await request(app)
                .post("/api/v1/auth/logout")
                .set(
                    "Authorization",
                    `Bearer ${firstLogin.body.data.accessToken}`,
                )
                .set(
                    "Cookie",
                    secondCookie!,
                );


        expect(logout.status)
            .toBe(401);


        const unchanged =
            await testPrisma.session.findUnique({

                where: {
                    id:
                        secondSession!.id,
                },

            });


        expect(unchanged!.status)
            .toBe("ACTIVE");

    });


    it("rejects logout without authentication", async () => {

        const response =
            await request(app)
                .post("/api/v1/auth/logout")
                .send({});


        expect(response.status)
            .toBe(401);

    });

});

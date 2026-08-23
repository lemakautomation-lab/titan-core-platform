import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import { testPrisma } from "../../helpers/prisma-test.client";
import { createTestUser } from "../../factories/user.factory";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";


describe("Authentication Rate Limiting", () => {


    it("returns HTTP 429 after the authentication rate-limit threshold is exceeded", async () => {

        const { user, password } =
            await createTestUser();


        const responses = [];


        for (let attempt = 0; attempt < 4; attempt++) {

            responses.push(
                await request(app)
                    .post("/api/v1/auth/login")
                    .set(
                        "X-Request-Id",
                        `TITAN-RATE-LOGIN-${crypto.randomUUID()}`,
                    )
                    .set(
                        "User-Agent",
                        "TITAN-RATE-LIMIT-TEST",
                    )
                    .send({
                        tenantId:
                            user.tenantId,

                        email:
                            user.email,

                        password:
                            attempt === 3
                                ? "WrongPassword123!"
                                : password,
                    }),
            );

        }


        expect(responses[0].status)
            .toBe(200);

        expect(responses[1].status)
            .toBe(200);

        expect(responses[2].status)
            .toBe(200);

        expect(responses[3].status)
            .toBe(429);


        expect(responses[3].body)
            .toEqual({
                error:
                    "Too Many Requests",

                message:
                    "Too many authentication attempts. Please try again later.",
            });


        expect(responses[3].headers["x-ratelimit-limit"])
            .toBeDefined();

    });



    it("persists a RATE_LIMIT_EXCEEDED security event with request context", async () => {

        const { user, password } =
            await createTestUser();


        let requestId: string;


        const userAgent =
            "TITAN-RATE-LIMIT-EVENT-TEST";


        for (let attempt = 0; attempt < 3; attempt++) {

            await request(app)
                .post("/api/v1/auth/login")
                .set(
                    "X-Request-Id",
                    `${requestId}-${attempt}`,
                )
                .set(
                    "User-Agent",
                    userAgent,
                )
                .send({
                    tenantId:
                        user.tenantId,

                    email:
                        user.email,

                    password,
                });

        }


        const limitedResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .set(
                    "X-Request-Id",
                    `TITAN-RATE-EVENT-${crypto.randomUUID()}`,
                )
                .set(
                    "User-Agent",
                    userAgent,
                )
                .send({
                    tenantId:
                        user.tenantId,

                    email:
                        user.email,

                    password,
                });


        expect(limitedResponse.status)
            .toBe(429);


        requestId =
            limitedResponse.headers["x-request-id"];


        expect(requestId)
            .toBeDefined();


        expect(requestId)
            .not
            .toBe(
                expect.stringContaining("TITAN-RATE-EVENT-"),
            );


        const securityEvents =
            await testPrisma.securityEvent.findMany({

                where: {

                    requestId,

                    eventType:
                        "RATE_LIMIT_EXCEEDED",

                },

            });


        expect(securityEvents)
            .toHaveLength(1);


        const securityEvent =
            securityEvents[0];


        expect(securityEvent.tenantId)
            .toBeNull();

        expect(securityEvent.userId)
            .toBeNull();

        expect(securityEvent.requestId)
            .toBe(requestId);

        expect(securityEvent.userAgent)
            .toBe(userAgent);

        expect(securityEvent.ipAddress)
            .not.toBeNull();


        const metadata =
            securityEvent.metadata as Record<string, unknown>;


        expect(metadata.method)
            .toBe("POST");

        expect(metadata.path)
            .toBe("/api/v1/auth/login");

    });



    it("applies the authentication rate limiter to refresh requests", async () => {

        const { user, password } =
            await createTestUser();


        const loginResponse =
            await request(app)
                .post("/api/v1/auth/login")
                .set(
                    "X-Request-Id",
                    `TITAN-RATE-REFRESH-LOGIN-${crypto.randomUUID()}`,
                )
                .set(
                    "User-Agent",
                    "TITAN-RATE-REFRESH-TEST",
                )
                .send({
                    tenantId:
                        user.tenantId,

                    email:
                        user.email,

                    password,
                });


        expect(loginResponse.status)
            .toBe(200);


        let cookies =
            loginResponse.headers["set-cookie"];


        expect(cookies)
            .toBeDefined();


        /*
         * Login itself consumes one authentication-rate-limit hit.
         * Reset the limiter so this test measures the refresh endpoint
         * independently.
         */

        await rateLimitModule.resetAuthRateLimiter();


        for (let attempt = 0; attempt < 3; attempt++) {

            const response =
                await request(app)
                    .post("/api/v1/auth/refresh")
                    .set(
                        "Cookie",
                        cookies,
                    )
                    .set(
                        "X-Request-Id",
                        `TITAN-RATE-REFRESH-${attempt}-${crypto.randomUUID()}`,
                    )
                    .set(
                        "User-Agent",
                        "TITAN-RATE-REFRESH-TEST",
                    );


            expect(response.status)
                .toBe(200);


            const rotatedCookies =
                response.headers["set-cookie"];


            expect(rotatedCookies)
                .toBeDefined();


            cookies =
                rotatedCookies;

        }


        const limitedResponse =
            await request(app)
                .post("/api/v1/auth/refresh")
                .set(
                    "Cookie",
                    cookies,
                )
                .set(
                    "X-Request-Id",
                    `TITAN-RATE-REFRESH-LIMITED-${crypto.randomUUID()}`,
                )
                .set(
                    "User-Agent",
                    "TITAN-RATE-REFRESH-TEST",
                );


        expect(limitedResponse.status)
            .toBe(429);



    });

});






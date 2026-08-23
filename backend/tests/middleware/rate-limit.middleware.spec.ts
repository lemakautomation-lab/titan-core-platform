import express from "express";
import request from "supertest";

import {
    describe,
    expect,
    it,
} from "vitest";

import {
    createApiRateLimiter,
    createAuthRateLimiter,
} from "../../src/middleware/rate-limit.middleware";


describe("Rate Limit Middleware", () => {


    it(
        "rejects requests with HTTP 429 after the configured API limit",
        async () => {

            const app =
                express();

            app.use(
                createApiRateLimiter(
                    60 * 1000,
                    2,
                ),
            );

            app.get(
                "/test",
                (_request, response) => {

                    response
                        .status(200)
                        .json({
                            success: true,
                        });

                },
            );

            const first =
                await request(app)
                    .get("/test");

            const second =
                await request(app)
                    .get("/test");

            const third =
                await request(app)
                    .get("/test");

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(third.status).toBe(429);

            expect(
                third.body,
            ).toMatchObject({
                error:
                    "Too Many Requests",

                message:
                    "Rate limit exceeded. Please try again later.",
            });

            expect(
                third.headers["x-ratelimit-limit"],
            ).toBe("2");

            expect(
                third.headers["x-ratelimit-remaining"],
            ).toBe("0");

        },
    );


    it(
        "enforces the authentication-specific rate limit",
        async () => {

            const app =
                express();

            app.use(
                createAuthRateLimiter(
                    60 * 1000,
                    2,
                ),
            );

            app.post(
                "/login",
                (_request, response) => {

                    response
                        .status(200)
                        .json({
                            success: true,
                        });

                },
            );

            const first =
                await request(app)
                    .post("/login");

            const second =
                await request(app)
                    .post("/login");

            const third =
                await request(app)
                    .post("/login");

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(third.status).toBe(429);

            expect(
                third.body,
            ).toMatchObject({
                error:
                    "Too Many Requests",

                message:
                    "Too many authentication attempts. Please try again later.",
            });

            expect(
                third.headers["x-ratelimit-limit"],
            ).toBe("2");

            expect(
                third.headers["x-ratelimit-remaining"],
            ).toBe("0");

        },
    );


});


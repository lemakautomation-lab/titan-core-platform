import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";


describe("HTTP CORS Security", () => {

    it(
        "allows the configured frontend origin",
        async () => {

            const response =
                await request(app)
                    .get("/api/v1/health")
                    .set(
                        "Origin",
                        "http://localhost:5173",
                    );


            expect(
                response.status,
            ).toBe(200);


            expect(
                response.headers[
                    "access-control-allow-origin"
                ],
            ).toBe(
                "http://localhost:5173",
            );


            expect(
                response.headers[
                    "access-control-allow-credentials"
                ],
            ).toBe("true");

        },
    );


    it(
        "does not allow an untrusted origin",
        async () => {

            const response =
                await request(app)
                    .get("/api/v1/health")
                    .set(
                        "Origin",
                        "https://evil.example",
                    );


            expect(
                response.status,
            ).toBe(200);


            expect(
                response.headers[
                    "access-control-allow-origin"
                ],
            ).toBeUndefined();

        },
    );


    it(
        "handles a credentialed preflight request for the configured frontend origin",
        async () => {

            const response =
                await request(app)
                    .options("/api/v1/health")
                    .set(
                        "Origin",
                        "http://localhost:5173",
                    )
                    .set(
                        "Access-Control-Request-Method",
                        "GET",
                    )
                    .set(
                        "Access-Control-Request-Headers",
                        "Authorization, Content-Type, X-Request-Id",
                    );


            expect(
                response.status,
            ).toBe(204);


            expect(
                response.headers[
                    "access-control-allow-origin"
                ],
            ).toBe(
                "http://localhost:5173",
            );


            expect(
                response.headers[
                    "access-control-allow-credentials"
                ],
            ).toBe("true");


            expect(
                response.headers[
                    "access-control-allow-methods"
                ],
            ).toContain("GET");


            expect(
                response.headers[
                    "access-control-allow-headers"
                ],
            ).toContain("Authorization");

        },
    );


    it(
        "rejects an untrusted preflight origin",
        async () => {

            const response =
                await request(app)
                    .options("/api/v1/health")
                    .set(
                        "Origin",
                        "https://evil.example",
                    )
                    .set(
                        "Access-Control-Request-Method",
                        "GET",
                    );


            expect(
                response.status,
            ).toBe(204);


            expect(
                response.headers[
                    "access-control-allow-origin"
                ],
            ).toBeUndefined();

        },
    );

});

import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";


describe("HTTP Security Headers", () => {

    it(
        "applies the required Helmet security headers",
        async () => {

            const response =
                await request(app)
                    .get("/api/v1/health");


            expect(
                response.status,
            ).toBe(200);


            expect(
                response.headers[
                    "content-security-policy"
                ],
            ).toContain(
                "default-src 'self'",
            );


            expect(
                response.headers[
                    "content-security-policy"
                ],
            ).toContain(
                "object-src 'none'",
            );


            expect(
                response.headers[
                    "content-security-policy"
                ],
            ).toContain(
                "frame-ancestors 'self'",
            );


            expect(
                response.headers[
                    "x-content-type-options"
                ],
            ).toBe(
                "nosniff",
            );


            expect(
                response.headers[
                    "x-frame-options"
                ],
            ).toBe(
                "SAMEORIGIN",
            );


            expect(
                response.headers[
                    "referrer-policy"
                ],
            ).toBe(
                "no-referrer",
            );


            expect(
                response.headers[
                    "strict-transport-security"
                ],
            ).toBe(
                "max-age=31536000; includeSubDomains",
            );


            expect(
                response.headers[
                    "cross-origin-opener-policy"
                ],
            ).toBe(
                "same-origin",
            );


            expect(
                response.headers[
                    "cross-origin-resource-policy"
                ],
            ).toBe(
                "same-origin",
            );


            expect(
                response.headers[
                    "x-dns-prefetch-control"
                ],
            ).toBe(
                "off",
            );


            expect(
                response.headers[
                    "x-download-options"
                ],
            ).toBe(
                "noopen",
            );


            expect(
                response.headers[
                    "x-permitted-cross-domain-policies"
                ],
            ).toBe(
                "none",
            );


            expect(
                response.headers[
                    "x-xss-protection"
                ],
            ).toBe(
                "0",
            );

        },
    );

});

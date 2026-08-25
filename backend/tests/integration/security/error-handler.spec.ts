import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../../../src/middleware/error-handler.middleware";

describe("Error Handler Security", () => {

    it("returns a sanitized 500 response for unexpected exceptions", () => {

        const req = {
            originalUrl: "/api/v1/security-test",
            method: "GET",
        } as any;

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));

        const res = {
            status,
        } as any;

        const next = vi.fn();

        const secretMessage =
            "DATABASE_PASSWORD=super-secret-value";

        const error =
            new Error(secretMessage);

        error.stack =
            `Error: ${secretMessage}\n` +
            "at secretInternalFunction (internal.js:42:7)";

        errorHandler(
            error,
            req,
            res,
            next,
        );

        expect(status)
            .toHaveBeenCalledWith(500);

        expect(json)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: {
                        code: "INTERNAL_SERVER_ERROR",
                        message:
                            "An unexpected error occurred.",
                    },
                    path:
                        "/api/v1/security-test",
                }),
            );

        const response =
            json.mock.calls[0][0];

        const serializedResponse =
            JSON.stringify(response);

        expect(serializedResponse)
            .not.toContain(secretMessage);

        expect(serializedResponse)
            .not.toContain("secretInternalFunction");

        expect(serializedResponse)
            .not.toContain("DATABASE_PASSWORD");

        expect(next)
            .not.toHaveBeenCalled();

    });

});

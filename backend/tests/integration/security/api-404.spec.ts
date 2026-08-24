import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

describe("API 404 Handling", () => {

    it("returns structured 404 for an unknown route", async () => {

        const response =
            await request(app)
                .get("/api/v1/definitely-not-a-real-route");

        expect(response.status).toBe(404);

        expect(response.body.success)
            .toBe(false);

        expect(response.body.error.code)
            .toBe("NOT_FOUND");

        expect(response.body.error.message)
            .toBe("Route not found.");

        expect(response.body.path)
            .toBe("/api/v1/definitely-not-a-real-route");

        expect(response.body.timestamp)
            .toEqual(expect.any(String));

    });

});


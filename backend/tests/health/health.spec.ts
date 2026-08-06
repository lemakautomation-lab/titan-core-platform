import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";

describe("Health Endpoint", () => {

    it("returns HTTP 200", async () => {

        const response =
            await request(app)
                .get("/api/v1/health");

        expect(response.status).toBe(200);

    });

});

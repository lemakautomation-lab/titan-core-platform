import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";
import { rateLimitModule } from "../../../src/infrastructure/composition/rate-limit.module";

describe("My Athlete personal details", () => {
    beforeEach(async () => { await rateLimitModule.resetAuthRateLimiter(); });

    it("requires authentication", async () => {
        const response = await request(app).get("/api/v1/auth/me/personal-details");
        expect(response.status).toBe(401);
    });

    it("returns only the authenticated Athlete's profile", async () => {
        const { user, password } = await createTestUser();
        await testPrisma.user.update({
            where: { id: user.id }, data: { selectedUserType: "ATHLETE" },
        });
        const athlete = await testPrisma.athlete.create({
            data: { tenantId: user.tenantId, userId: user.id,
                firstName: "Synthetic", lastName: "Athlete", countryCode: "ZA" },
        });
        const login = await request(app).post("/api/v1/auth/login").send({
            tenantId: user.tenantId, email: user.email, password,
        });
        expect(login.status).toBe(200);
        const response = await request(app)
            .get("/api/v1/auth/me/personal-details")
            .set("Authorization", `Bearer ${login.body.data.accessToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            userId: user.id, athleteId: athlete.id, tenantId: user.tenantId,
            firstName: "Synthetic", lastName: "Athlete", countryCode: "ZA",
        });
        expect(response.headers["cache-control"]).toBe("no-store");
    });

    it("does not expose a profile for a Trainer", async () => {
        const { user, password } = await createTestUser();
        await testPrisma.user.update({
            where: { id: user.id }, data: { selectedUserType: "TRAINER" },
        });
        const login = await request(app).post("/api/v1/auth/login").send({
            tenantId: user.tenantId, email: user.email, password,
        });
        const response = await request(app)
            .get("/api/v1/auth/me/personal-details")
            .set("Authorization", `Bearer ${login.body.data.accessToken}`);
        expect(response.status).toBe(404);
    });
});

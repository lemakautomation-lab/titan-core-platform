import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../../src/app";
import { jwtService } from "../../../src/security/jwt";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

describe("Inactive tenant access gate", () => {
    it("revokes access for a previously valid token and allows it only after reactivation", async () => {
        const { user, tenant } = await createTestUser();
        const token = jwtService.generateAccessToken({
            userId: user.id, tenantId: tenant.id, roles: [],
        });
        const me = () => request(app).get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${token}`);
        expect((await me()).status).toBe(200);
        try {
            await testPrisma.tenant.update({
                where: { id: tenant.id }, data: { status: "INACTIVE" },
            });
            expect((await me()).status).toBe(401);
        } finally {
            await testPrisma.tenant.update({
                where: { id: tenant.id }, data: { status: "ACTIVE" },
            });
        }
        expect((await me()).status).toBe(200);
    });
});

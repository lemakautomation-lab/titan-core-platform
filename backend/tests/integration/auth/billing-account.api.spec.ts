import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import app from "../../../src/app";
import { createTestUser } from "../../factories/user.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

const createdUsers: string[] = [];

afterAll(async () => {
    await testPrisma.billingAccount.deleteMany({ where: { userId: { in: createdUsers } } });
});

describe("Mission 110.1 authenticated billing account API", () => {
    it("rejects anonymous calls and derives identity only from the access token", async () => {
        const path = "/api/v1/auth/me/billing-account";
        expect((await request(app).put(path)).status).toBe(401);

        const first = await createTestUser();
        const second = await createTestUser();
        createdUsers.push(first.user.id, second.user.id);
        const login = await request(app).post("/api/v1/auth/login").send({
            tenantId: first.tenant.id,
            email: first.user.email,
            password: first.password,
        });
        expect(login.status).toBe(200);
        const token = login.body.data.accessToken;

        const one = await request(app).put(path)
            .set("Authorization", `Bearer ${token}`)
            .send({ userId: second.user.id, tenantId: second.tenant.id, status: "CONFIRMED" });
        const two = await request(app).put(path)
            .set("Authorization", `Bearer ${token}`);
        expect(one.status).toBe(200);
        expect(two.status).toBe(200);
        expect(one.body.id).toBe(two.body.id);
        expect(await testPrisma.billingAccount.count({ where: { tenantId: first.tenant.id, userId: first.user.id } })).toBe(1);
        expect(await testPrisma.billingAccount.count({ where: { tenantId: second.tenant.id } })).toBe(0);
        expect(await testPrisma.payment.count({ where: { tenantId: first.tenant.id } })).toBe(0);
        expect(await testPrisma.userTypeEntitlement.count({ where: { tenantId: first.tenant.id } })).toBe(0);

        await testPrisma.user.update({ where: { id: first.user.id }, data: { status: "INACTIVE" } });
        expect((await request(app).put(path).set("Authorization", `Bearer ${token}`)).status).toBe(403);
    });
});

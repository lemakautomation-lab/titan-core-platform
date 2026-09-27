import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { BillingAccountService } from "../../src/application/billing/billing-account.service";
import { DatabaseService } from "../../src/infrastructure/database/database.service";
import { testPrisma } from "../helpers/prisma-test.client";

const service = new BillingAccountService(new DatabaseService());
const tenants: string[] = [];
const users: string[] = [];

afterAll(async () => {
    await testPrisma.billingAccount.deleteMany({ where: { tenantId: { in: tenants } } });
    await testPrisma.user.deleteMany({ where: { id: { in: users } } });
    await testPrisma.tenant.deleteMany({ where: { id: { in: tenants } } });
});

describe("Mission 110.1 billing account boundary", () => {
    it("creates one account for an active tenant user without payment or entitlement", async () => {
        const a = await testPrisma.tenant.create({ data: { name: "Billing A", slug: `billing-a-${randomUUID()}` } });
        const b = await testPrisma.tenant.create({ data: { name: "Billing B", slug: `billing-b-${randomUUID()}` } });
        tenants.push(a.id, b.id);
        const active = await testPrisma.user.create({ data: { tenantId: a.id, email: `billing-${randomUUID()}@titan.test`, passwordHash: "test-hash" } });
        const inactive = await testPrisma.user.create({ data: { tenantId: a.id, email: `billing-${randomUUID()}@titan.test`, passwordHash: "test-hash", status: "INACTIVE" } });
        users.push(active.id, inactive.id);

        expect(await service.ensureForAuthenticatedUser(b.id, active.id)).toBeNull();
        expect(await service.ensureForAuthenticatedUser(a.id, inactive.id)).toBeNull();
        expect(await service.ensureForAuthenticatedUser(a.id, randomUUID())).toBeNull();

        const first = await service.ensureForAuthenticatedUser(a.id, active.id);
        const second = await service.ensureForAuthenticatedUser(a.id, active.id);
        expect(first?.id).toBeDefined();
        expect(second?.id).toBe(first?.id);
        expect(await testPrisma.billingAccount.count({ where: { tenantId: a.id } })).toBe(1);
        expect(await testPrisma.payment.count({ where: { tenantId: a.id } })).toBe(0);
        expect(await testPrisma.userTypeEntitlement.count({ where: { tenantId: a.id } })).toBe(0);

        await expect(testPrisma.billingAccount.create({ data: { tenantId: b.id, userId: active.id } })).rejects.toThrow();
        await testPrisma.user.update({ where: { id: active.id }, data: { status: "SUSPENDED" } });
        expect(await service.ensureForAuthenticatedUser(a.id, active.id)).toBeNull();
    });
});

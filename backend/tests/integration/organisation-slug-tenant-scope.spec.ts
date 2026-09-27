import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { testPrisma } from "../helpers/prisma-test.client";

describe("Organisation slug tenant scope", () => {
    const tenants: string[] = [];

    afterEach(async () => {
        await testPrisma.organisation.deleteMany({where: {tenantId: {in: tenants}}});
        await testPrisma.tenant.deleteMany({where: {id: {in: tenants}}});
        tenants.length = 0;
    });

    it("allows the same slug in separate tenants and rejects a duplicate within one tenant", async () => {
        const tenantA = randomUUID();
        const tenantB = randomUUID();
        tenants.push(tenantA, tenantB);
        await testPrisma.tenant.createMany({data: [
            {id: tenantA, name: "First tenant", slug: `tenant-${tenantA}`},
            {id: tenantB, name: "Second tenant", slug: `tenant-${tenantB}`},
        ]});
        const slug = `shared-${randomUUID()}`;
        await testPrisma.organisation.create({data: {tenantId: tenantA, name: "Shared name", slug}});
        await expect(testPrisma.organisation.create({data: {
            tenantId: tenantB, name: "Shared name", slug,
        }})).resolves.toMatchObject({tenantId: tenantB, slug});
        await expect(testPrisma.organisation.create({data: {
            tenantId: tenantA, name: "Duplicate", slug,
        }})).rejects.toMatchObject({code: "P2002"});
    });
});

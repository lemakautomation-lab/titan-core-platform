import {
    randomUUID,
} from "node:crypto";

import {
    afterEach,
    describe,
    expect,
    it,
} from "vitest";

import {
    testPrisma,
} from "../helpers/prisma-test.client";

describe("Organisation hierarchy persistence", () => {

    const tenantIds: string[] = [];
    const organisationIds: string[] = [];

    afterEach(async () => {

        await testPrisma.organisation.deleteMany({
            where: {
                id: {
                    in: organisationIds,
                },
            },
        });

        await testPrisma.tenant.deleteMany({
            where: {
                id: {
                    in: tenantIds,
                },
            },
        });

        organisationIds.length = 0;
        tenantIds.length = 0;

    });

    it("allows hierarchy within the same tenant", async () => {

        const tenantId = randomUUID();
        const parentId = randomUUID();
        const childId = randomUUID();

        tenantIds.push(tenantId);
        organisationIds.push(childId, parentId);

        await testPrisma.tenant.create({
            data: {
                id: tenantId,
                name: "Hierarchy Tenant",
                slug: `hierarchy-${tenantId}`,
            },
        });

        await testPrisma.organisation.create({
            data: {
                id: parentId,
                tenantId,
                name: "Parent Organisation",
                slug: `parent-${parentId}`,
            },
        });

        const child =
            await testPrisma.organisation.create({
                data: {
                    id: childId,
                    tenantId,
                    parentOrganisationId: parentId,
                    name: "Child Organisation",
                    slug: `child-${childId}`,
                },
            });

        expect(child.parentOrganisationId)
            .toBe(parentId);

    });

    it("rejects hierarchy across tenants", async () => {

        const tenantAId = randomUUID();
        const tenantBId = randomUUID();
        const parentId = randomUUID();
        const childId = randomUUID();

        tenantIds.push(tenantAId, tenantBId);
        organisationIds.push(childId, parentId);

        await testPrisma.tenant.createMany({
            data: [
                {
                    id: tenantAId,
                    name: "Tenant A",
                    slug: `tenant-a-${tenantAId}`,
                },
                {
                    id: tenantBId,
                    name: "Tenant B",
                    slug: `tenant-b-${tenantBId}`,
                },
            ],
        });

        await testPrisma.organisation.create({
            data: {
                id: parentId,
                tenantId: tenantAId,
                name: "Parent",
                slug: `parent-${parentId}`,
            },
        });

        await expect(
            testPrisma.organisation.create({
                data: {
                    id: childId,
                    tenantId: tenantBId,
                    parentOrganisationId: parentId,
                    name: "Invalid Child",
                    slug: `child-${childId}`,
                },
            }),
        ).rejects.toMatchObject({
            code: "P2003",
        });

    });

    it("rejects self-parenting", async () => {

        const tenantId = randomUUID();
        const organisationId = randomUUID();

        tenantIds.push(tenantId);
        organisationIds.push(organisationId);

        await testPrisma.tenant.create({
            data: {
                id: tenantId,
                name: "Self Parent Tenant",
                slug: `self-${tenantId}`,
            },
        });

        await expect(
            testPrisma.organisation.create({
                data: {
                    id: organisationId,
                    tenantId,
                    parentOrganisationId: organisationId,
                    name: "Self Parent",
                    slug: `self-${organisationId}`,
                },
            }),
        ).rejects.toThrow();

    });

});

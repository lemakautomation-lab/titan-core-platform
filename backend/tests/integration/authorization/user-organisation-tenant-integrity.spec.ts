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
} from "../../helpers/prisma-test.client";

describe("User Organisation Tenant Integrity", () => {

    const tenantIds: string[] = [];
    const organisationIds: string[] = [];
    const userIds: string[] = [];

    afterEach(async () => {

        await testPrisma.user.deleteMany({
            where: {
                id: {
                    in: userIds,
                },
            },
        });

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

        userIds.length = 0;
        organisationIds.length = 0;
        tenantIds.length = 0;

    });

    it("rejects a User linked to an Organisation from another tenant", async () => {

        const tenantAId =
            randomUUID();

        const tenantBId =
            randomUUID();

        const organisationId =
            randomUUID();

        const userId =
            randomUUID();

        tenantIds.push(
            tenantAId,
            tenantBId,
        );

        organisationIds.push(
            organisationId,
        );

        userIds.push(
            userId,
        );

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
                id: organisationId,
                tenantId: tenantAId,
                name: "Tenant A Organisation",
                slug: `tenant-a-organisation-${organisationId}`,
            },
        });

        await expect(
            testPrisma.user.create({
                data: {
                    id: userId,
                    tenantId: tenantBId,
                    organisationId,
                    email: `${userId}@test.invalid`,
                    passwordHash: "not-used",
                },
            }),
        ).rejects.toMatchObject({
            code: "P2003",
        });

    });

    it("allows a User linked to an Organisation in the same tenant", async () => {

        const tenantId =
            randomUUID();

        const organisationId =
            randomUUID();

        const userId =
            randomUUID();

        tenantIds.push(
            tenantId,
        );

        organisationIds.push(
            organisationId,
        );

        userIds.push(
            userId,
        );

        await testPrisma.tenant.create({
            data: {
                id: tenantId,
                name: "Tenant",
                slug: `tenant-${tenantId}`,
            },
        });

        await testPrisma.organisation.create({
            data: {
                id: organisationId,
                tenantId,
                name: "Organisation",
                slug: `organisation-${organisationId}`,
            },
        });

        const user =
            await testPrisma.user.create({
                data: {
                    id: userId,
                    tenantId,
                    organisationId,
                    email: `${userId}@test.invalid`,
                    passwordHash: "not-used",
                },
            });

        expect(user.organisationId)
            .toBe(organisationId);

        expect(user.tenantId)
            .toBe(tenantId);

    });

});

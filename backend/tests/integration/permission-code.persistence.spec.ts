import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { PermissionMapper } from "../../src/infrastructure/mappers/permission.mapper";
import { testPrisma } from "../helpers/prisma-test.client";

describe("Permission code persistence", () => {

    const tenantIds: string[] = [];
    const permissionIds: string[] = [];

    afterEach(async () => {

        await testPrisma.permission.deleteMany({
            where: {
                id: {
                    in: permissionIds,
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

        tenantIds.length = 0;
        permissionIds.length = 0;

    });

    it("persists code independently and enforces tenant-scoped uniqueness", async () => {

        const tenantId = randomUUID();
        const firstId = randomUUID();
        const secondId = randomUUID();

        tenantIds.push(tenantId);
        permissionIds.push(firstId, secondId);

        await testPrisma.tenant.create({
            data: {
                id: tenantId,
                name: "Permission Tenant",
                slug: `permission-${tenantId}`,
            },
        });

        const record =
            await testPrisma.permission.create({
                data: {
                    id: firstId,
                    tenantId,
                    code: "users.read",
                    name: "Read Users",
                },
            });

        const permission =
            PermissionMapper.toDomain(record);

        expect(permission.getCode())
            .toBe("users.read");

        expect(permission.name)
            .toBe("Read Users");

        await expect(
            testPrisma.permission.create({
                data: {
                    id: secondId,
                    tenantId,
                    code: "users.read",
                    name: "Duplicate Code",
                },
            }),
        ).rejects.toMatchObject({
            code: "P2002",
        });

    });

});

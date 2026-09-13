import { describe, expect, it } from "vitest";
import { createTestUser } from "../../factories/user.factory";
import { createRole } from "../../factories/role.factory";
import { createPermission } from "../../factories/permission.factory";
import { testPrisma } from "../../helpers/prisma-test.client";

describe("RolePermission Tenant Integrity", () => {
    it("persists a role-permission assignment within the same tenant", async () => {
        const user = await createTestUser();
        const role = await createRole(
            user.tenant.id,
            `role-permission-integrity-${Date.now()}`,
        );
        const permission = await createPermission(
            user.tenant.id,
            `permission-integrity-${Date.now()}`,
        );

        const assignment = await testPrisma.rolePermission.create({
            data: {
                tenantId: user.tenant.id,
                roleId: role.id,
                permissionId: permission.id,
            },
        });

        expect(assignment.tenantId).toBe(user.tenant.id);
        expect(assignment.roleId).toBe(role.id);
        expect(assignment.permissionId).toBe(permission.id);
    });

    it("rejects a role from one tenant paired with a permission from another tenant", async () => {
        const tenantAUser = await createTestUser();
        const tenantBUser = await createTestUser();

        const role = await createRole(
            tenantAUser.tenant.id,
            `cross-tenant-role-${Date.now()}`,
        );
        const permission = await createPermission(
            tenantBUser.tenant.id,
            `cross-tenant-permission-${Date.now()}`,
        );

        await expect(
            testPrisma.rolePermission.create({
                data: {
                    tenantId: tenantAUser.tenant.id,
                    roleId: role.id,
                    permissionId: permission.id,
                },
            }),
        ).rejects.toThrow();

        const count = await testPrisma.rolePermission.count({
            where: {
                roleId: role.id,
                permissionId: permission.id,
            },
        });

        expect(count).toBe(0);
    });

    it("rejects a permission from one tenant paired with a role from another tenant", async () => {
        const tenantAUser = await createTestUser();
        const tenantBUser = await createTestUser();

        const role = await createRole(
            tenantBUser.tenant.id,
            `cross-tenant-role-reverse-${Date.now()}`,
        );
        const permission = await createPermission(
            tenantAUser.tenant.id,
            `cross-tenant-permission-reverse-${Date.now()}`,
        );

        await expect(
            testPrisma.rolePermission.create({
                data: {
                    tenantId: tenantBUser.tenant.id,
                    roleId: role.id,
                    permissionId: permission.id,
                },
            }),
        ).rejects.toThrow();

        const count = await testPrisma.rolePermission.count({
            where: {
                roleId: role.id,
                permissionId: permission.id,
            },
        });

        expect(count).toBe(0);
    });
});

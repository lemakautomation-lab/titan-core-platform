import { testPrisma } from "../helpers/prisma-test.client";
import { createPermission } from "./permission.factory";

export async function createRole(
    tenantId: string,
    name: string,
    permissions: string[] = [],
    description?: string,
) {

    const role =
        await testPrisma.role.upsert({

            where: {
                tenantId_name: {
                    tenantId,
                    name,
                },
            },

            update: {
                description,
            },

            create: {
                tenantId,
                name,
                description,
            },

        });

    for (const permissionName of permissions) {

        const permission =
            await createPermission(
                tenantId,
                permissionName,
            );

        await testPrisma.rolePermission.upsert({

            where: {
                tenantId_roleId_permissionId: {
                    tenantId,
                    roleId: role.id,
                    permissionId: permission.id,
                },
            },

            update: {},

            create: {
                tenantId,
                roleId: role.id,
                permissionId: permission.id,
            },

        });
    }

    return role;
}

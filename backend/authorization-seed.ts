import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";

async function main() {
    const adminUser =
        await prisma.user.findUnique({
            where: {
                id: "1582932c-9abe-4d26-bb8d-66884a6cc150",
            },
            select: {
                id: true,
                tenantId: true,
            },
        });

    if (!adminUser) {
        throw new Error(
            "Admin user not found.",
        );
    }

    const tenantId =
        adminUser.tenantId;

    const permissionNames = [
        "users.read",
        "users.create",
        "users.update",
        "users.delete",

        "roles.read",
        "roles.create",
        "roles.update",
        "roles.delete",

        "permissions.read",
        "permissions.create",
        "permissions.update",
        "permissions.delete",

        "roles.permissions.manage",
    ];

    const permissions = [];

    for (const name of permissionNames) {
        const permission =
            await prisma.permission.upsert({
                where: {
                    tenantId_name: {
                        tenantId,
                        name,
                    },
                },
                update: {},
                create: {
                    tenantId,
                    name,
                    description:
                        `Permission ${name}`,
                },
            });

        permissions.push(permission);
    }

    const role =
        await prisma.role.upsert({
            where: {
                tenantId_name: {
                    tenantId,
                    name: "ADMIN",
                },
            },
            update: {},
            create: {
                tenantId,
                name: "ADMIN",
                description:
                    "Enterprise Administrator",
            },
        });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: role.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: role.id,
        },
    });

    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: role.id,
                permissionId: permission.id,
            },
        });
    }

    console.log(
        `Authorization seed complete for tenant ${tenantId}.`,
    );
}

main()
    .catch(console.error)
    .finally(
        async () => {
            await prisma.$disconnect();
        },
    );

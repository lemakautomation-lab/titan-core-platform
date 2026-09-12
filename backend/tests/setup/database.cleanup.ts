import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
    assertSafeTestDatabaseConfiguration,
} from "./database.setup";

const connectionString =
    assertSafeTestDatabaseConfiguration(
        process.env.DATABASE_URL,
    );

const adapter =
    new PrismaPg({
        connectionString,
    });

const prisma =
    new PrismaClient({
        adapter,
    });

export async function cleanupTestDatabase(): Promise<void> {

    await prisma.$transaction([

        prisma.rolePermission.deleteMany(),

        prisma.userRole.deleteMany(),

        prisma.session.deleteMany(),

        prisma.securityEvent.deleteMany(),

        prisma.auditLog.deleteMany(),

        prisma.user.deleteMany(),

        prisma.organisation.deleteMany(),

        prisma.role.deleteMany(),

        prisma.permission.deleteMany(),

        prisma.tenant.deleteMany(),

    ]);

}

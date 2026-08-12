import { testPrisma } from "../helpers/prisma-test.client";

export async function createPermission(
    tenantId: string,
    name: string,
    description?: string,
) {
    const existing = await testPrisma.permission.findFirst({
        where: {
            tenantId,
            name,
        },
    });

    if (existing) {
        return testPrisma.permission.update({
            where: {
                id: existing.id,
            },
            data: {
                description,
            },
        });
    }

    return testPrisma.permission.create({
        data: {
            tenantId,
            name,
            description,
        },
    });
}

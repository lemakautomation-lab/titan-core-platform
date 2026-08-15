import { testPrisma } from "../helpers/prisma-test.client";
import { hashTestPassword } from "../helpers/password.helper";
import { createTestTenant } from "./tenant.factory";
import { assignPermissions } from "./rbac.factory";

export async function createTestUser(
    overrides?: {
        email?: string;
        password?: string;
        permissions?: string[];
        tenantId?: string;
    },
) {

    const tenant =
        overrides?.tenantId
            ? await testPrisma.tenant.findUniqueOrThrow({
                where: {
                    id: overrides.tenantId,
                },
            })
            : await createTestTenant();

    const password =
        overrides?.password ??
        "Password123!";

    const passwordHash =
        await hashTestPassword(
            password,
        );

    const user =
        await testPrisma.user.create({

            data: {

                tenantId:
                    tenant.id,

                email:
                    overrides?.email ??
                    `test-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}@titan.test`,

                passwordHash,

            },

        });

    if (
        overrides?.permissions &&
        overrides.permissions.length > 0
    ) {

        await assignPermissions(
            user.id,
            overrides.permissions,
        );

    }

    return {
        user,
        password,
        tenant,
    };
}

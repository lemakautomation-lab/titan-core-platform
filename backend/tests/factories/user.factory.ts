import { testPrisma } from "../helpers/prisma-test.client";
import { hashTestPassword } from "../helpers/password.helper";
import { createTestTenant } from "./tenant.factory";


export async function createTestUser(
    overrides?: {

        email?: string;

        password?: string;

    }

) {

    const tenant =
        await createTestTenant();


    const password =
        overrides?.password ??
        "Password123!";


    const passwordHash =
        await hashTestPassword(
            password
        );


    const user =
        await testPrisma.user.create({

            data: {

                tenantId:
                    tenant.id,

                email:
                    overrides?.email ??
                    `test-${Date.now()}@titan.test`,

                passwordHash

            }

        });


    return {

        user,

        password

    };

}

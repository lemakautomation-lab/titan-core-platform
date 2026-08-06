import { testPrisma } from "../helpers/prisma-test.client";


export async function createTestTenant() {

    return testPrisma.tenant.create({

        data: {

            name:
                "Test Tenant",

            slug:
                `test-tenant-${Date.now()}`

        }

    });

}

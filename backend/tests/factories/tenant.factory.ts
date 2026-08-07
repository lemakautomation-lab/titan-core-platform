import crypto from "node:crypto";

import { testPrisma } from "../helpers/prisma-test.client";


export async function createTestTenant() {

    return testPrisma.tenant.create({

        data: {

            name:
                `Test Tenant ${crypto.randomUUID()}`,

            slug:
                `test-tenant-${crypto.randomUUID()}`,

        },

    });

}

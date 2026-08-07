import { testPrisma } from "../helpers/prisma-test.client";


export async function createPermission(
    name: string,
    description?: string,
) {

    return testPrisma.permission.upsert({

        where: {

            name,

        },

        update: {

            description,

        },

        create: {

            name,

            description,

        },

    });

}

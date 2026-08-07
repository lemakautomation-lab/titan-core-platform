import { testPrisma } from "../helpers/prisma-test.client";

import { createRole }
    from "./role.factory";


export async function assignRole(

    userId: string,

    roleName: string,

    permissions: string[] = [],

) {

    const role =
        await createRole(

            roleName,

            permissions,

        );


    await testPrisma.userRole.upsert({

        where: {

            userId_roleId: {

                userId,

                roleId:
                    role.id,

            },

        },

        update: {},

        create: {

            userId,

            roleId:
                role.id,

        },

    });


    return role;

}


export async function assignPermissions(

    userId: string,

    permissions: string[],

) {

    return assignRole(

        userId,

        `test-role-${Date.now()}`,

        permissions,

    );

}

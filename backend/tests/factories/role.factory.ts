import { testPrisma } from "../helpers/prisma-test.client";

import { createPermission }
    from "./permission.factory";


export async function createRole(

    name: string,

    permissions: string[] = [],

    description?: string,

) {

    const role =
        await testPrisma.role.upsert({

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


    for (const permissionName of permissions) {

        const permission =
            await createPermission(
                permissionName,
            );


        await testPrisma.rolePermission.upsert({

            where: {

                roleId_permissionId: {

                    roleId:
                        role.id,

                    permissionId:
                        permission.id,

                },

            },

            update: {},

            create: {

                roleId:
                    role.id,

                permissionId:
                    permission.id,

            },

        });

    }


    return role;

}

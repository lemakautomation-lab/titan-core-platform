import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";

async function main() {

    console.log("========== USERS ==========");

    const users =
        await prisma.user.findMany({

            select: {

                id: true,
                email: true,

                userRoles: {

                    select: {

                        role: {

                            select: {

                                id: true,
                                name: true,

                                permissions: {

                                    select: {

                                        permission: {

                                            select: {

                                                id: true,
                                                name: true,

                                            },

                                        },

                                    },

                                },

                            },

                        },

                    },

                },

            },

        });


    console.dir(
        users,
        {
            depth: null,
        },
    );


    console.log("========== PERMISSIONS ==========");


    const permissions =
        await prisma.permission.findMany();


    console.dir(
        permissions,
        {
            depth: null,
        },
    );

}


main()

    .catch(console.error)

    .finally(

        async () => {

            await prisma.$disconnect();

        },

    );

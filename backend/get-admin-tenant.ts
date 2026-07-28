import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";


async function main() {

    const user =
        await prisma.user.findUnique({

            where: {

                id:
                    "1582932c-9abe-4d26-bb8d-66884a6cc150",

            },

            select: {

                email: true,

                tenantId: true,

            },

        });


    console.log(user);

}


main()

.catch(console.error)

.finally(

    async () => {

        await prisma.$disconnect();

    },

);

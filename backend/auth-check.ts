import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";


async function main() {

    const users =
        await prisma.user.findMany({

            select: {

                email: true,

                passwordHash: true,

            },

        });


    console.log(users);

}


main()

    .catch(console.error)

    .finally(

        async () => {

            await prisma.$disconnect();

        },

    );

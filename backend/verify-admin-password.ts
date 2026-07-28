import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";
import { passwordSecurity } from "./src/security/bcrypt";


async function main() {

    const user =
        await prisma.user.findUnique({

            where: {

                id:
                    "1582932c-9abe-4d26-bb8d-66884a6cc150",

            },

        });


    if (!user) {

        throw new Error("User not found");

    }


    const valid =
        await passwordSecurity.verify(

            "TitanAdmin123!",

            user.passwordHash,

        );


    console.log({

        email: user.email,

        passwordHash: user.passwordHash,

        passwordMatches: valid,

    });

}


main()

.catch(console.error)

.finally(

    async () => {

        await prisma.$disconnect();

    },

);

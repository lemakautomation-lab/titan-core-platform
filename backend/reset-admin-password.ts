import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";
import { passwordSecurity } from "./src/security/bcrypt";


async function main() {

    const newPassword =
        "TitanAdmin123!";


    const passwordHash =
        await passwordSecurity.hash(
            newPassword,
        );


    await prisma.user.update({

        where: {

            id:
                "1582932c-9abe-4d26-bb8d-66884a6cc150",

        },

        data: {

            passwordHash,

        },

    });


    console.log(
        "Admin password reset complete",
    );

    console.log(
        "New password:",
        newPassword,
    );

}


main()

    .catch(console.error)

    .finally(

        async () => {

            await prisma.$disconnect();

        },

    );

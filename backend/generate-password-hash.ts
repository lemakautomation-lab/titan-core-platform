import { passwordSecurity } from "./src/security/bcrypt";

async function run() {

    const hash =
        await passwordSecurity.hash(
            "Admin@12345"
        );

    console.log(hash);

}

run();

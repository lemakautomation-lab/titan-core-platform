import bcrypt from "bcrypt";


export async function hashTestPassword(
    password: string
): Promise<string> {

    return bcrypt.hash(
        password,
        12
    );

}

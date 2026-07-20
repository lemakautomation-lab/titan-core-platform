import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export class PasswordSecurity {

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    async verify(
        password: string,
        hashedPassword: string
    ): Promise<boolean> {

        return bcrypt.compare(
            password,
            hashedPassword
        );

    }

}

export const passwordSecurity = new PasswordSecurity();
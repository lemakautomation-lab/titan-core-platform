export class EmailValidator {

    private static readonly pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    static isValid(
        email: string,
    ): boolean {

        return this.pattern.test(email);

    }

}

export class UuidValidator {

    private static readonly pattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    static isValid(
        value: string,
    ): boolean {

        return this.pattern.test(value);

    }

}

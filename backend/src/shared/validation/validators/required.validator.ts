export class RequiredValidator {

    static isValid(
        value: unknown,
    ): boolean {

        return value !== undefined
            && value !== null
            && value !== "";

    }

}

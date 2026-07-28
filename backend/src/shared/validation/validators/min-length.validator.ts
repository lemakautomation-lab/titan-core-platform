export class MinLengthValidator {

    static isValid(
        value: string,
        length: number,
    ): boolean {

        return value.length >= length;

    }

}

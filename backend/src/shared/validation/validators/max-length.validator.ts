export class MaxLengthValidator {

    static isValid(
        value: string,
        length: number,
    ): boolean {

        return value.length <= length;

    }

}

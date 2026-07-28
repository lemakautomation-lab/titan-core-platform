import { ValidationError } from "./validation-error";

export class ValidationResult {

    constructor(

        public readonly isValid: boolean,

        public readonly errors: ValidationError[],

    ) {}

    static success(): ValidationResult {

        return new ValidationResult(

            true,

            [],

        );

    }

    static failure(

        errors: ValidationError[],

    ): ValidationResult {

        return new ValidationResult(

            false,

            errors,

        );

    }

}

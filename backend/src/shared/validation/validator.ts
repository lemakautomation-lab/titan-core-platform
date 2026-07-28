import { ValidationError } from "./validation-error";
import { ValidationResult } from "./validation-result";

export abstract class Validator<T> {

    protected readonly errors: ValidationError[] = [];

    abstract validate(

        model: T,

    ): ValidationResult;

    protected addError(

        field: string,

        message: string,

    ): void {

        this.errors.push({

            field,

            message,

        });

    }

    protected success(): ValidationResult {

        return ValidationResult.success();

    }

    protected failure(): ValidationResult {

        return ValidationResult.failure(

            this.errors,

        );

    }

}

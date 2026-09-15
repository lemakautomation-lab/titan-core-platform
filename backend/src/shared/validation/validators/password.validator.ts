import {
    Validator,
} from "../validator";
import {
    ValidationResult,
} from "../validation-result";
import {
    RequiredValidator,
} from "./required.validator";
import {
    MinLengthValidator,
} from "./min-length.validator";
import {
    MaxLengthValidator,
} from "./max-length.validator";

export interface PasswordValidationModel {
    password: string;
}

export class PasswordValidator
extends Validator<PasswordValidationModel> {
    validate(
        model: PasswordValidationModel,
    ): ValidationResult {
        this.errors.length = 0;

        if (
            !RequiredValidator.isValid(
                model.password,
            )
        ) {
            this.addError(
                "password",
                "Password is required.",
            );

            return this.failure();
        }

        if (
            !MinLengthValidator.isValid(
                model.password,
                8,
            )
        ) {
            this.addError(
                "password",
                "Password must be at least 8 characters.",
            );
        }

        if (
            !MaxLengthValidator.isValid(
                model.password,
                128,
            )
        ) {
            this.addError(
                "password",
                "Password exceeds maximum length.",
            );
        }

        return this.errors.length === 0
            ? this.success()
            : this.failure();
    }
}

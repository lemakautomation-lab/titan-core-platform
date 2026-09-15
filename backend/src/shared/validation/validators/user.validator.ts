import { Validator } from "../validator";
import { ValidationResult } from "../validation-result";

import { RequiredValidator } from "./required.validator";
import { EmailValidator } from "./email.validator";
import {
    PasswordValidator,
} from "./password.validator";

export interface CreateUserValidationModel {
    email: string;
    password: string;
    tenantId: string;
}

export class UserValidator
extends Validator<CreateUserValidationModel> {
    validate(
        model: CreateUserValidationModel,
    ): ValidationResult {
        this.errors.length = 0;

        if (
            !RequiredValidator.isValid(
                model.tenantId,
            )
        ) {
            this.addError(
                "tenantId",
                "Tenant ID is required.",
            );
        }

        if (
            !RequiredValidator.isValid(
                model.email,
            )
        ) {
            this.addError(
                "email",
                "Email is required.",
            );
        }
        else if (
            !EmailValidator.isValid(
                model.email,
            )
        ) {
            this.addError(
                "email",
                "Email format is invalid.",
            );
        }

        const passwordValidation =
            new PasswordValidator()
                .validate({
                    password:
                        model.password,
                });

        for (
            const error of
            passwordValidation.errors
        ) {
            this.addError(
                error.field,
                error.message,
            );
        }

        return this.errors.length === 0
            ? this.success()
            : this.failure();
    }
}

import { Validator } from "../validator";
import { ValidationResult } from "../validation-result";

import { RequiredValidator } from "./required.validator";
import { EmailValidator } from "./email.validator";
import { MinLengthValidator } from "./min-length.validator";
import { MaxLengthValidator } from "./max-length.validator";

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

        if (!RequiredValidator.isValid(model.tenantId)) {

            this.addError(
                "tenantId",
                "Tenant ID is required.",
            );

        }

        if (!RequiredValidator.isValid(model.email)) {

            this.addError(
                "email",
                "Email is required.",
            );

        } else if (
            !EmailValidator.isValid(model.email)
        ) {

            this.addError(
                "email",
                "Email format is invalid.",
            );

        }

        if (!RequiredValidator.isValid(model.password)) {

            this.addError(
                "password",
                "Password is required.",
            );

        } else {

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

        }

        return this.errors.length === 0
            ? this.success()
            : this.failure();

    }

}

import {
    CompletePasswordResetCommand,
} from "../commands/complete-password-reset.command";
import {
    Result,
} from "../common/result";
import {
    PasswordResetTransaction,
} from "../ports/password-reset.transaction";
import {
    PasswordValidator,
} from "../../shared/validation/validators/password.validator";
import {
    PasswordSecurity,
    passwordSecurity,
} from "../../security/bcrypt";
import {
    hashPasswordResetToken,
} from "../../security/password-reset-token.security";

export const PASSWORD_RESET_TOKEN_INVALID =
    "Password reset token is invalid or expired.";

export class CompletePasswordResetUseCase {
    constructor(
        private readonly transaction:
            PasswordResetTransaction,
        private readonly passwordHasher:
            Pick<PasswordSecurity, "hash"> =
                passwordSecurity,
        private readonly clock:
            () => Date = () => new Date(),
    ) {}

    async execute(
        command: CompletePasswordResetCommand,
    ): Promise<Result<boolean>> {
        const validation =
            new PasswordValidator()
                .validate({
                    password:
                        command.newPassword,
                });

        if (!validation.isValid) {
            return Result.failure(
                validation.errors[0].message,
            );
        }

        let tokenHash: string;

        try {
            tokenHash =
                hashPasswordResetToken(
                    command.token,
                );
        }
        catch {
            return Result.failure(
                PASSWORD_RESET_TOKEN_INVALID,
            );
        }

        try {
            const passwordHash =
                await this.passwordHasher.hash(
                    command.newPassword,
                );

            const completed =
                await this.transaction.complete(
                    Object.freeze({
                        tokenHash,
                        passwordHash,
                        completedAt:
                            this.clock(),
                    }),
                );

            if (!completed) {
                return Result.failure(
                    PASSWORD_RESET_TOKEN_INVALID,
                );
            }

            return Result.success(true);
        }
        catch {
            return Result.failure(
                PASSWORD_RESET_TOKEN_INVALID,
            );
        }
    }
}

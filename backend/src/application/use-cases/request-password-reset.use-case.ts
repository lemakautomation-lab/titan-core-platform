import {
    RequestPasswordResetCommand,
} from "../commands/request-password-reset.command";
import {
    Result,
} from "../common/result";
import {
    PasswordResetEmailDelivery,
} from "../ports/password-reset-email-delivery";
import {
    PasswordResetTransaction,
} from "../ports/password-reset.transaction";
import {
    User,
} from "../../domain/entities/user.entity";
import {
    generatePasswordResetToken,
} from "../../security/password-reset-token.security";

export const PASSWORD_RESET_REQUEST_ACCEPTED =
    "If an eligible account exists, password-reset instructions will be sent.";

export class RequestPasswordResetUseCase {
    constructor(
        private readonly transaction:
            PasswordResetTransaction,
        private readonly delivery:
            PasswordResetEmailDelivery,
        private readonly consumerTenantSlug:
            string,
        private readonly frontendUrl:
            string,
        private readonly ttlMinutes:
            number,
        private readonly clock:
            () => Date = () => new Date(),
    ) {}

    async execute(
        command: RequestPasswordResetCommand,
    ): Promise<Result<string>> {
        let normalizedEmail: string;

        try {
            normalizedEmail =
                User.normalizeEmail(
                    command.email,
                );
        }
        catch {
            return Result.success(
                PASSWORD_RESET_REQUEST_ACCEPTED,
            );
        }

        try {
            const generated =
                generatePasswordResetToken();

            const issuedAt =
                this.clock();

            const expiresAt =
                new Date(
                    issuedAt.getTime() +
                    this.ttlMinutes *
                    60_000,
                );

            const target =
                await this.transaction
                    .issueForConsumer(
                        this.consumerTenantSlug,
                        normalizedEmail,
                        Object.freeze({
                            tokenHash:
                                generated.tokenHash,
                            issuedAt,
                            expiresAt,
                        }),
                    );

            if (!target) {
                return Result.success(
                    PASSWORD_RESET_REQUEST_ACCEPTED,
                );
            }

            const resetUrl =
                new URL(
                    "/reset-password",
                    this.frontendUrl,
                );

            resetUrl.searchParams.set(
                "token",
                generated.rawToken,
            );

            try {
                await this.delivery.deliver(
                    Object.freeze({
                        recipientEmail:
                            target.email,
                        resetUrl:
                            resetUrl.toString(),
                        expiresAt,
                    }),
                );
            }
            catch {
                await this.transaction.revoke(
                    generated.tokenHash,
                    this.clock(),
                );
            }
        }
        catch {
            return Result.success(
                PASSWORD_RESET_REQUEST_ACCEPTED,
            );
        }

        return Result.success(
            PASSWORD_RESET_REQUEST_ACCEPTED,
        );
    }
}

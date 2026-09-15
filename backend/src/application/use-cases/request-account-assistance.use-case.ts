import {
    Result,
} from "../common/result";
import {
    AccountAssistanceTransaction,
} from "../ports/account-assistance.transaction";
import {
    generateAccountAssistanceReference,
} from "../../security/account-assistance-reference.security";

const REQUEST_TTL_HOURS = 72;

export interface AccountAssistanceResponse {
    reference: string;
    expiresAt: Date;
    message: string;
}

export class RequestAccountAssistanceUseCase {
    constructor(
        private readonly transaction:
            AccountAssistanceTransaction,
        private readonly consumerTenantSlug:
            string,
        private readonly clock:
            () => Date = () => new Date(),
    ) {}

    async execute():
    Promise<Result<AccountAssistanceResponse>> {
        const generated =
            generateAccountAssistanceReference();

        const createdAt =
            this.clock();

        const expiresAt =
            new Date(
                createdAt.getTime() +
                REQUEST_TTL_HOURS *
                60 *
                60_000,
            );

        try {
            const issued =
                await this.transaction
                    .openForConsumer(
                        this.consumerTenantSlug,
                        Object.freeze({
                            referenceHash:
                                generated.referenceHash,
                            createdAt,
                            expiresAt,
                        }),
                    );

            if (!issued) {
                return Result.failure(
                    "Account assistance is temporarily unavailable.",
                );
            }

            return Result.success(
                Object.freeze({
                    reference:
                        generated.rawReference,
                    expiresAt,
                    message:
                        "Your account-assistance request has been created. Keep this reference and contact authorised TITAN support.",
                }),
            );
        }
        catch {
            return Result.failure(
                "Account assistance is temporarily unavailable.",
            );
        }
    }
}

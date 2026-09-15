import {
    AccountAssistanceIssueInput,
    AccountAssistanceIssueResult,
    AccountAssistanceTransaction,
} from "../../application/ports/account-assistance.transaction";
import {
    DatabaseService,
} from "../database/database.service";

export class PrismaAccountAssistanceTransaction
implements AccountAssistanceTransaction {
    constructor(
        private readonly database:
            DatabaseService,
    ) {}

    async openForConsumer(
        consumerTenantSlug: string,
        input:
            Readonly<AccountAssistanceIssueInput>,
    ): Promise<AccountAssistanceIssueResult | null> {
        return this.database.transaction(
            async (tx) => {
                const tenant =
                    await tx.tenant.findUnique({
                        where: {
                            slug:
                                consumerTenantSlug,
                        },
                        select: {
                            id: true,
                            status: true,
                        },
                    });

                if (
                    !tenant ||
                    tenant.status !== "ACTIVE"
                ) {
                    return null;
                }

                const request =
                    await tx
                        .accountAssistanceRequest
                        .create({
                            data: {
                                tenantId:
                                    tenant.id,
                                referenceHash:
                                    input.referenceHash,
                                status:
                                    "OPEN",
                                expiresAt:
                                    input.expiresAt,
                                createdAt:
                                    input.createdAt,
                            },
                            select: {
                                id: true,
                                tenantId: true,
                            },
                        });

                return Object.freeze({
                    requestId:
                        request.id,
                    tenantId:
                        request.tenantId,
                });
            },
        );
    }
}

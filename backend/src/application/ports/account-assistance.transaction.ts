export interface AccountAssistanceIssueInput {
    referenceHash: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface AccountAssistanceIssueResult {
    requestId: string;
    tenantId: string;
}

export interface AccountAssistanceTransaction {
    openForConsumer(
        consumerTenantSlug: string,
        input:
            Readonly<AccountAssistanceIssueInput>,
    ): Promise<AccountAssistanceIssueResult | null>;
}

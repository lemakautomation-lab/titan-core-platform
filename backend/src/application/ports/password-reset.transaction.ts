export interface PasswordResetIssueInput {
    tokenHash: string;
    issuedAt: Date;
    expiresAt: Date;
}

export interface PasswordResetDeliveryTarget {
    userId: string;
    tenantId: string;
    email: string;
}

export interface PasswordResetCompletionInput {
    tokenHash: string;
    passwordHash: string;
    completedAt: Date;
}

export interface PasswordResetTransaction {
    issueForConsumer(
        consumerTenantSlug: string,
        normalizedEmail: string,
        input: Readonly<PasswordResetIssueInput>,
    ): Promise<PasswordResetDeliveryTarget | null>;

    revoke(
        tokenHash: string,
        revokedAt: Date,
    ): Promise<void>;

    complete(
        input: Readonly<PasswordResetCompletionInput>,
    ): Promise<boolean>;
}

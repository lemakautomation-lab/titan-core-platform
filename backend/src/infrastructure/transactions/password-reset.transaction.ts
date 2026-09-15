import {
    PasswordResetCompletionInput,
    PasswordResetDeliveryTarget,
    PasswordResetIssueInput,
    PasswordResetTransaction,
} from "../../application/ports/password-reset.transaction";
import {
    DatabaseService,
} from "../database/database.service";

export class PrismaPasswordResetTransaction
implements PasswordResetTransaction {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async issueForConsumer(
        consumerTenantSlug: string,
        normalizedEmail: string,
        input: Readonly<PasswordResetIssueInput>,
    ): Promise<PasswordResetDeliveryTarget | null> {
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

                const user =
                    await tx.user.findUnique({
                        where: {
                            tenantId_email: {
                                tenantId:
                                    tenant.id,
                                email:
                                    normalizedEmail,
                            },
                        },
                        select: {
                            id: true,
                            tenantId: true,
                            email: true,
                            status: true,
                        },
                    });

                if (
                    !user ||
                    user.status !== "ACTIVE"
                ) {
                    return null;
                }

                await tx.passwordResetToken
                    .updateMany({
                        where: {
                            tenantId:
                                user.tenantId,
                            userId:
                                user.id,
                            consumedAt:
                                null,
                            revokedAt:
                                null,
                        },
                        data: {
                            revokedAt:
                                input.issuedAt,
                        },
                    });

                await tx.passwordResetToken.create({
                    data: {
                        tenantId:
                            user.tenantId,
                        userId:
                            user.id,
                        tokenHash:
                            input.tokenHash,
                        expiresAt:
                            input.expiresAt,
                        createdAt:
                            input.issuedAt,
                    },
                });

                return Object.freeze({
                    userId:
                        user.id,
                    tenantId:
                        user.tenantId,
                    email:
                        user.email,
                });
            },
        );
    }

    async revoke(
        tokenHash: string,
        revokedAt: Date,
    ): Promise<void> {
        await this.database.prisma
            .passwordResetToken
            .updateMany({
                where: {
                    tokenHash,
                    consumedAt:
                        null,
                    revokedAt:
                        null,
                },
                data: {
                    revokedAt,
                },
            });
    }

    async complete(
        input: Readonly<PasswordResetCompletionInput>,
    ): Promise<boolean> {
        return this.database.transaction(
            async (tx) => {
                const token =
                    await tx.passwordResetToken
                        .findUnique({
                            where: {
                                tokenHash:
                                    input.tokenHash,
                            },
                            select: {
                                id: true,
                                tenantId: true,
                                userId: true,
                            },
                        });

                if (!token) {
                    return false;
                }

                const claimed =
                    await tx.passwordResetToken
                        .updateMany({
                            where: {
                                id:
                                    token.id,
                                tenantId:
                                    token.tenantId,
                                userId:
                                    token.userId,
                                consumedAt:
                                    null,
                                revokedAt:
                                    null,
                                expiresAt: {
                                    gt:
                                        input.completedAt,
                                },
                            },
                            data: {
                                consumedAt:
                                    input.completedAt,
                            },
                        });

                if (claimed.count !== 1) {
                    return false;
                }

                const updatedUser =
                    await tx.user.updateMany({
                        where: {
                            id:
                                token.userId,
                            tenantId:
                                token.tenantId,
                            status:
                                "ACTIVE",
                        },
                        data: {
                            passwordHash:
                                input.passwordHash,
                        },
                    });

                if (updatedUser.count !== 1) {
                    throw new Error(
                        "Password reset account is unavailable.",
                    );
                }

                await tx.session.updateMany({
                    where: {
                        userId:
                            token.userId,
                        status:
                            "ACTIVE",
                    },
                    data: {
                        status:
                            "REVOKED",
                    },
                });

                await tx.passwordResetToken
                    .updateMany({
                        where: {
                            tenantId:
                                token.tenantId,
                            userId:
                                token.userId,
                            id: {
                                not:
                                    token.id,
                            },
                            consumedAt:
                                null,
                            revokedAt:
                                null,
                        },
                        data: {
                            revokedAt:
                                input.completedAt,
                        },
                    });

                return true;
            },
        );
    }
}

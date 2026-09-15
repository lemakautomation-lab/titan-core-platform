import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    CompletePasswordResetCommand,
} from "../../src/application/commands/complete-password-reset.command";
import {
    RequestPasswordResetCommand,
} from "../../src/application/commands/request-password-reset.command";
import {
    PasswordResetTransaction,
} from "../../src/application/ports/password-reset.transaction";
import {
    CompletePasswordResetUseCase,
    PASSWORD_RESET_TOKEN_INVALID,
} from "../../src/application/use-cases/complete-password-reset.use-case";
import {
    PASSWORD_RESET_REQUEST_ACCEPTED,
    RequestPasswordResetUseCase,
} from "../../src/application/use-cases/request-password-reset.use-case";
import {
    getPasswordResetFrontendUrl,
    getPasswordResetTokenTtlMinutes,
} from "../../src/config/password-reset.config";
import {
    hashPasswordResetToken,
} from "../../src/security/password-reset-token.security";
import {
    FakePasswordResetEmailDelivery,
} from "../fakes/fake-password-reset-email-delivery";

function createTransaction():
PasswordResetTransaction {
    return {
        issueForConsumer:
            vi.fn(async () => null),
        revoke:
            vi.fn(async () => undefined),
        complete:
            vi.fn(async () => false),
    };
}

describe(
    "Password reset application boundary",
    () => {
        it(
            "validates reset configuration",
            () => {
                expect(
                    getPasswordResetTokenTtlMinutes(
                        undefined,
                    ),
                ).toBe(15);

                expect(
                    getPasswordResetTokenTtlMinutes(
                        "60",
                    ),
                ).toBe(60);

                expect(
                    () =>
                        getPasswordResetTokenTtlMinutes(
                            "61",
                        ),
                ).toThrow(
                    "Password reset token expiry is invalid.",
                );

                expect(
                    getPasswordResetFrontendUrl(
                        undefined,
                        "test",
                    ),
                ).toBe(
                    "http://localhost:5173",
                );

                expect(
                    () =>
                        getPasswordResetFrontendUrl(
                            "http://titan.example",
                            "production",
                        ),
                ).toThrow(
                    "TITAN Health frontend URL must use HTTPS.",
                );
            },
        );

        it(
            "issues only a token hash and delivers the raw token in the URL",
            async () => {
                const transaction =
                    createTransaction();

                vi.mocked(
                    transaction
                        .issueForConsumer,
                ).mockResolvedValue({
                    userId: "user-1",
                    tenantId: "tenant-1",
                    email:
                        "athlete@example.com",
                });

                const delivery =
                    new FakePasswordResetEmailDelivery();

                const issuedAt =
                    new Date(
                        "2026-09-15T12:00:00.000Z",
                    );

                const useCase =
                    new RequestPasswordResetUseCase(
                        transaction,
                        delivery,
                        "titan-health-consumer",
                        "https://health.titan.test",
                        15,
                        () => issuedAt,
                    );

                const result =
                    await useCase.execute(
                        new RequestPasswordResetCommand(
                            " ATHLETE@EXAMPLE.COM ",
                        ),
                    );

                expect(result.isSuccess)
                    .toBe(true);
                expect(result.value)
                    .toBe(
                        PASSWORD_RESET_REQUEST_ACCEPTED,
                    );

                expect(
                    transaction
                        .issueForConsumer,
                ).toHaveBeenCalledOnce();

                const issueCall =
                    vi.mocked(
                        transaction
                            .issueForConsumer,
                    ).mock.calls[0];

                expect(issueCall[0]).toBe(
                    "titan-health-consumer",
                );
                expect(issueCall[1]).toBe(
                    "athlete@example.com",
                );
                expect(issueCall[2].tokenHash)
                    .toMatch(
                        /^[0-9a-f]{64}$/,
                    );

                expect(delivery.messages)
                    .toHaveLength(1);

                const deliveredUrl =
                    new URL(
                        delivery.messages[0]
                            .resetUrl,
                    );

                const rawToken =
                    deliveredUrl.searchParams
                        .get("token");

                expect(rawToken).toMatch(
                    /^[A-Za-z0-9_-]{43}$/,
                );
                expect(
                    hashPasswordResetToken(
                        rawToken!,
                    ),
                ).toBe(
                    issueCall[2].tokenHash,
                );
                expect(
                    delivery.messages[0]
                        .resetUrl,
                ).not.toContain(
                    issueCall[2].tokenHash,
                );
            },
        );

        it(
            "returns the same response for an unavailable account",
            async () => {
                const transaction =
                    createTransaction();
                const delivery =
                    new FakePasswordResetEmailDelivery();

                const useCase =
                    new RequestPasswordResetUseCase(
                        transaction,
                        delivery,
                        "titan-health-consumer",
                        "https://health.titan.test",
                        15,
                    );

                const result =
                    await useCase.execute(
                        new RequestPasswordResetCommand(
                            "missing@example.com",
                        ),
                    );

                expect(result.isSuccess)
                    .toBe(true);
                expect(result.value)
                    .toBe(
                        PASSWORD_RESET_REQUEST_ACCEPTED,
                    );
                expect(delivery.messages)
                    .toHaveLength(0);
            },
        );

        it(
            "revokes the issued token when delivery fails",
            async () => {
                const transaction =
                    createTransaction();

                vi.mocked(
                    transaction
                        .issueForConsumer,
                ).mockResolvedValue({
                    userId: "user-1",
                    tenantId: "tenant-1",
                    email:
                        "athlete@example.com",
                });

                const delivery =
                    new FakePasswordResetEmailDelivery();

                delivery.failDelivery = true;

                const clock = vi.fn()
                    .mockReturnValueOnce(
                        new Date(
                            "2026-09-15T12:00:00.000Z",
                        ),
                    )
                    .mockReturnValueOnce(
                        new Date(
                            "2026-09-15T12:00:01.000Z",
                        ),
                    );

                const useCase =
                    new RequestPasswordResetUseCase(
                        transaction,
                        delivery,
                        "titan-health-consumer",
                        "https://health.titan.test",
                        15,
                        clock,
                    );

                const result =
                    await useCase.execute(
                        new RequestPasswordResetCommand(
                            "athlete@example.com",
                        ),
                    );

                const issued =
                    vi.mocked(
                        transaction
                            .issueForConsumer,
                    ).mock.calls[0][2];

                expect(result.value)
                    .toBe(
                        PASSWORD_RESET_REQUEST_ACCEPTED,
                    );
                expect(
                    transaction.revoke,
                ).toHaveBeenCalledWith(
                    issued.tokenHash,
                    new Date(
                        "2026-09-15T12:00:01.000Z",
                    ),
                );
            },
        );

        it(
            "validates and completes a password reset",
            async () => {
                const transaction =
                    createTransaction();

                vi.mocked(
                    transaction.complete,
                ).mockResolvedValue(true);

                const passwordHasher = {
                    hash:
                        vi.fn(
                            async () =>
                                "new-password-hash",
                        ),
                };

                const completedAt =
                    new Date(
                        "2026-09-15T12:00:00.000Z",
                    );

                const rawToken =
                    "A".repeat(43);

                const useCase =
                    new CompletePasswordResetUseCase(
                        transaction,
                        passwordHasher,
                        () => completedAt,
                    );

                const result =
                    await useCase.execute(
                        new CompletePasswordResetCommand(
                            rawToken,
                            "Password123!",
                        ),
                    );

                expect(result.isSuccess)
                    .toBe(true);
                expect(result.value)
                    .toBe(true);
                expect(passwordHasher.hash)
                    .toHaveBeenCalledWith(
                        "Password123!",
                    );
                expect(
                    transaction.complete,
                ).toHaveBeenCalledWith({
                    tokenHash:
                        hashPasswordResetToken(
                            rawToken,
                        ),
                    passwordHash:
                        "new-password-hash",
                    completedAt,
                });
            },
        );

        it(
            "rejects malformed, expired and reused tokens generically",
            async () => {
                const transaction =
                    createTransaction();

                const useCase =
                    new CompletePasswordResetUseCase(
                        transaction,
                        {
                            hash:
                                vi.fn(
                                    async () =>
                                        "unused-hash",
                                ),
                        },
                    );

                const malformed =
                    await useCase.execute(
                        new CompletePasswordResetCommand(
                            "invalid",
                            "Password123!",
                        ),
                    );

                expect(malformed.isSuccess)
                    .toBe(false);
                expect(malformed.error)
                    .toBe(
                        PASSWORD_RESET_TOKEN_INVALID,
                    );

                const unavailable =
                    await useCase.execute(
                        new CompletePasswordResetCommand(
                            "B".repeat(43),
                            "Password123!",
                        ),
                    );

                expect(unavailable.isSuccess)
                    .toBe(false);
                expect(unavailable.error)
                    .toBe(
                        PASSWORD_RESET_TOKEN_INVALID,
                    );
            },
        );

        it(
            "reuses the existing password policy",
            async () => {
                const transaction =
                    createTransaction();

                const useCase =
                    new CompletePasswordResetUseCase(
                        transaction,
                    );

                const result =
                    await useCase.execute(
                        new CompletePasswordResetCommand(
                            "C".repeat(43),
                            "short",
                        ),
                    );

                expect(result.isSuccess)
                    .toBe(false);
                expect(result.error).toBe(
                    "Password must be at least 8 characters.",
                );
                expect(
                    transaction.complete,
                ).not.toHaveBeenCalled();
            },
        );
    },
);

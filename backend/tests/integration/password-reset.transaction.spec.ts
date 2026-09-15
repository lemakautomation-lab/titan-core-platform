import {
    randomUUID,
} from "node:crypto";
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import {
    PrismaPasswordResetTransaction,
} from "../../src/infrastructure/transactions/password-reset.transaction";
import {
    DatabaseService,
} from "../../src/infrastructure/database/database.service";
import {
    testPrisma,
} from "../helpers/prisma-test.client";

const transaction =
    new PrismaPasswordResetTransaction(
        new DatabaseService(),
    );

const firstSlug =
    `password-reset-${randomUUID()}`;
const secondSlug =
    `password-reset-${randomUUID()}`;

let firstTenantId: string;
let secondTenantId: string;

const hash = (
    character: string,
): string => character.repeat(64);

const issueInput = (
    tokenHash: string,
    issuedAt = new Date(),
) => ({
    tokenHash,
    issuedAt,
    expiresAt:
        new Date(
            issuedAt.getTime() + 15 * 60_000,
        ),
});

async function createUser(
    tenantId: string,
    email: string,
    status:
        "ACTIVE" |
        "INACTIVE" |
        "SUSPENDED" |
        "LOCKED" = "ACTIVE",
) {
    return testPrisma.user.create({
        data: {
            tenantId,
            email,
            passwordHash:
                "original-password-hash",
            status,
        },
    });
}

beforeAll(async () => {
    const first =
        await testPrisma.tenant.create({
            data: {
                name:
                    "Password Reset Tenant One",
                slug:
                    firstSlug,
            },
        });

    const second =
        await testPrisma.tenant.create({
            data: {
                name:
                    "Password Reset Tenant Two",
                slug:
                    secondSlug,
            },
        });

    firstTenantId = first.id;
    secondTenantId = second.id;
});

afterAll(async () => {
    const tenantIds = [
        firstTenantId,
        secondTenantId,
    ];

    const users =
        await testPrisma.user.findMany({
            where: {
                tenantId: {
                    in:
                        tenantIds,
                },
            },
            select: {
                id: true,
            },
        });

    const userIds =
        users.map((user) => user.id);

    await testPrisma.session.deleteMany({
        where: {
            userId: {
                in:
                    userIds,
            },
        },
    });

    await testPrisma.passwordResetToken
        .deleteMany({
            where: {
                tenantId: {
                    in:
                        tenantIds,
                },
            },
        });

    await testPrisma.user.deleteMany({
        where: {
            id: {
                in:
                    userIds,
            },
        },
    });

    await testPrisma.tenant.deleteMany({
        where: {
            id: {
                in:
                    tenantIds,
            },
        },
    });
});

describe(
    "Password reset transaction",
    () => {
        it(
            "resolves ownership from the consumer tenant and email",
            async () => {
                const email =
                    `owner-${randomUUID()}@titan.test`;

                const user =
                    await createUser(
                        firstTenantId,
                        email,
                    );

                const result =
                    await transaction
                        .issueForConsumer(
                            firstSlug,
                            email,
                            issueInput(hash("a")),
                        );

                expect(result).toEqual({
                    userId:
                        user.id,
                    tenantId:
                        firstTenantId,
                    email,
                });

                const stored =
                    await testPrisma
                        .passwordResetToken
                        .findUniqueOrThrow({
                            where: {
                                tokenHash:
                                    hash("a"),
                            },
                        });

                expect(stored.userId)
                    .toBe(user.id);
                expect(stored.tenantId)
                    .toBe(firstTenantId);
            },
        );

        it(
            "returns null without crossing tenant ownership",
            async () => {
                const email =
                    `isolated-${randomUUID()}@titan.test`;

                await createUser(
                    firstTenantId,
                    email,
                );

                const result =
                    await transaction
                        .issueForConsumer(
                            secondSlug,
                            email,
                            issueInput(hash("b")),
                        );

                expect(result).toBeNull();

                expect(
                    await testPrisma
                        .passwordResetToken
                        .count({
                            where: {
                                tokenHash:
                                    hash("b"),
                            },
                        }),
                ).toBe(0);
            },
        );

        it(
            "revokes previous tokens when issuing a replacement",
            async () => {
                const email =
                    `replacement-${randomUUID()}@titan.test`;

                await createUser(
                    firstTenantId,
                    email,
                );

                const firstIssuedAt =
                    new Date();

                await transaction.issueForConsumer(
                    firstSlug,
                    email,
                    issueInput(
                        hash("c"),
                        firstIssuedAt,
                    ),
                );

                const replacementIssuedAt =
                    new Date(
                        firstIssuedAt.getTime() +
                        1_000,
                    );

                await transaction.issueForConsumer(
                    firstSlug,
                    email,
                    issueInput(
                        hash("d"),
                        replacementIssuedAt,
                    ),
                );

                const previous =
                    await testPrisma
                        .passwordResetToken
                        .findUniqueOrThrow({
                            where: {
                                tokenHash:
                                    hash("c"),
                            },
                        });

                const replacement =
                    await testPrisma
                        .passwordResetToken
                        .findUniqueOrThrow({
                            where: {
                                tokenHash:
                                    hash("d"),
                            },
                        });

                expect(previous.revokedAt)
                    .toEqual(replacementIssuedAt);
                expect(replacement.revokedAt)
                    .toBeNull();
            },
        );

        it(
            "atomically resets the password and revokes all sessions and tokens",
            async () => {
                const email =
                    `complete-${randomUUID()}@titan.test`;

                const user =
                    await createUser(
                        firstTenantId,
                        email,
                    );

                await testPrisma.session
                    .createMany({
                        data: [
                            {
                                userId:
                                    user.id,
                                refreshToken:
                                    randomUUID(),
                                jti:
                                    randomUUID(),
                                expiresAt:
                                    new Date(
                                        Date.now() +
                                        60_000,
                                    ),
                            },
                            {
                                userId:
                                    user.id,
                                refreshToken:
                                    randomUUID(),
                                jti:
                                    randomUUID(),
                                expiresAt:
                                    new Date(
                                        Date.now() +
                                        60_000,
                                    ),
                            },
                        ],
                    });

                const issuedAt =
                    new Date();

                await transaction.issueForConsumer(
                    firstSlug,
                    email,
                    issueInput(
                        hash("e"),
                        issuedAt,
                    ),
                );

                await testPrisma.passwordResetToken
                    .create({
                        data: {
                            tenantId:
                                firstTenantId,
                            userId:
                                user.id,
                            tokenHash:
                                hash("f"),
                            createdAt:
                                issuedAt,
                            expiresAt:
                                new Date(
                                    issuedAt.getTime() +
                                    15 * 60_000,
                                ),
                        },
                    });

                const completedAt =
                    new Date(
                        issuedAt.getTime() +
                        1_000,
                    );

                await expect(
                    transaction.complete({
                        tokenHash:
                            hash("e"),
                        passwordHash:
                            "replacement-password-hash",
                        completedAt,
                    }),
                ).resolves.toBe(true);

                const updatedUser =
                    await testPrisma.user
                        .findUniqueOrThrow({
                            where: {
                                id:
                                    user.id,
                            },
                        });

                const consumed =
                    await testPrisma
                        .passwordResetToken
                        .findUniqueOrThrow({
                            where: {
                                tokenHash:
                                    hash("e"),
                            },
                        });

                const other =
                    await testPrisma
                        .passwordResetToken
                        .findUniqueOrThrow({
                            where: {
                                tokenHash:
                                    hash("f"),
                            },
                        });

                expect(updatedUser.passwordHash)
                    .toBe(
                        "replacement-password-hash",
                    );
                expect(consumed.consumedAt)
                    .toEqual(completedAt);
                expect(other.revokedAt)
                    .toEqual(completedAt);

                expect(
                    await testPrisma.session.count({
                        where: {
                            userId:
                                user.id,
                            status:
                                "ACTIVE",
                        },
                    }),
                ).toBe(0);

                await expect(
                    transaction.complete({
                        tokenHash:
                            hash("e"),
                        passwordHash:
                            "second-password-hash",
                        completedAt:
                            new Date(
                                completedAt.getTime() +
                                1_000,
                            ),
                    }),
                ).resolves.toBe(false);
            },
        );

        it(
            "rejects expired and explicitly revoked tokens",
            async () => {
                const email =
                    `invalid-${randomUUID()}@titan.test`;

                await createUser(
                    firstTenantId,
                    email,
                );

                const expiredIssuedAt =
                    new Date(
                        Date.now() -
                        20 * 60_000,
                    );

                await transaction.issueForConsumer(
                    firstSlug,
                    email,
                    issueInput(
                        hash("1"),
                        expiredIssuedAt,
                    ),
                );

                await expect(
                    transaction.complete({
                        tokenHash:
                            hash("1"),
                        passwordHash:
                            "unused-hash",
                        completedAt:
                            new Date(),
                    }),
                ).resolves.toBe(false);

                const activeIssuedAt =
                    new Date();

                await transaction.issueForConsumer(
                    firstSlug,
                    email,
                    issueInput(
                        hash("2"),
                        activeIssuedAt,
                    ),
                );

                await transaction.revoke(
                    hash("2"),
                    new Date(
                        activeIssuedAt.getTime() +
                        1_000,
                    ),
                );

                await expect(
                    transaction.complete({
                        tokenHash:
                            hash("2"),
                        passwordHash:
                            "unused-hash",
                        completedAt:
                            new Date(
                                activeIssuedAt.getTime() +
                                2_000,
                            ),
                    }),
                ).resolves.toBe(false);
            },
        );

        it(
            "rolls back token consumption when the User becomes unavailable",
            async () => {
                const email =
                    `rollback-${randomUUID()}@titan.test`;

                const user =
                    await createUser(
                        firstTenantId,
                        email,
                    );

                const issuedAt =
                    new Date();

                await transaction.issueForConsumer(
                    firstSlug,
                    email,
                    issueInput(
                        hash("3"),
                        issuedAt,
                    ),
                );

                await testPrisma.user.update({
                    where: {
                        id:
                            user.id,
                    },
                    data: {
                        status:
                            "LOCKED",
                    },
                });

                await expect(
                    transaction.complete({
                        tokenHash:
                            hash("3"),
                        passwordHash:
                            "unused-hash",
                        completedAt:
                            new Date(
                                issuedAt.getTime() +
                                1_000,
                            ),
                    }),
                ).rejects.toThrow(
                    "Password reset account is unavailable.",
                );

                const token =
                    await testPrisma
                        .passwordResetToken
                        .findUniqueOrThrow({
                            where: {
                                tokenHash:
                                    hash("3"),
                            },
                        });

                expect(token.consumedAt)
                    .toBeNull();
                expect(token.revokedAt)
                    .toBeNull();
            },
        );
    },
);

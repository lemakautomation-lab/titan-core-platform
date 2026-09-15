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
    DatabaseService,
} from "../../src/infrastructure/database/database.service";
import {
    PrismaAccountAssistanceTransaction,
} from "../../src/infrastructure/transactions/account-assistance.transaction";
import {
    testPrisma,
} from "../helpers/prisma-test.client";

const transaction =
    new PrismaAccountAssistanceTransaction(
        new DatabaseService(),
    );

const activeSlug =
    `account-assistance-${randomUUID()}`;
const inactiveSlug =
    `account-assistance-${randomUUID()}`;

let activeTenantId: string;
let inactiveTenantId: string;

beforeAll(async () => {
    const active =
        await testPrisma.tenant.create({
            data: {
                name:
                    "Account Assistance Active",
                slug:
                    activeSlug,
            },
        });

    const inactive =
        await testPrisma.tenant.create({
            data: {
                name:
                    "Account Assistance Inactive",
                slug:
                    inactiveSlug,
                status:
                    "INACTIVE",
            },
        });

    activeTenantId = active.id;
    inactiveTenantId = inactive.id;
});

afterAll(async () => {
    const tenantIds = [
        activeTenantId,
        inactiveTenantId,
    ];

    await testPrisma
        .accountAssistanceRequest
        .deleteMany({
            where: {
                tenantId: {
                    in:
                        tenantIds,
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
    "Account assistance transaction",
    () => {
        it(
            "opens a request only in the server-selected active Tenant",
            async () => {
                const createdAt =
                    new Date(
                        "2026-09-15T18:00:00.000Z",
                    );

                const result =
                    await transaction
                        .openForConsumer(
                            activeSlug,
                            {
                                referenceHash:
                                    "a".repeat(64),
                                createdAt,
                                expiresAt:
                                    new Date(
                                        createdAt.getTime() +
                                        72 * 60 * 60_000,
                                    ),
                            },
                        );

                expect(result).not.toBeNull();
                expect(result!.tenantId)
                    .toBe(activeTenantId);

                const stored =
                    await testPrisma
                        .accountAssistanceRequest
                        .findUniqueOrThrow({
                            where: {
                                id:
                                    result!.requestId,
                            },
                        });

                expect(stored.tenantId)
                    .toBe(activeTenantId);
                expect(stored.referenceHash)
                    .toBe("a".repeat(64));
                expect(stored.status)
                    .toBe("OPEN");
            },
        );

        it(
            "returns null for an unavailable Tenant",
            async () => {
                const createdAt =
                    new Date();

                const result =
                    await transaction
                        .openForConsumer(
                            inactiveSlug,
                            {
                                referenceHash:
                                    "b".repeat(64),
                                createdAt,
                                expiresAt:
                                    new Date(
                                        createdAt.getTime() +
                                        72 * 60 * 60_000,
                                    ),
                            },
                        );

                expect(result).toBeNull();

                expect(
                    await testPrisma
                        .accountAssistanceRequest
                        .count({
                            where: {
                                referenceHash:
                                    "b".repeat(64),
                            },
                        }),
                ).toBe(0);
            },
        );

        it(
            "returns null for an unknown Tenant",
            async () => {
                const createdAt =
                    new Date();

                await expect(
                    transaction.openForConsumer(
                        "missing-consumer-tenant",
                        {
                            referenceHash:
                                "c".repeat(64),
                            createdAt,
                            expiresAt:
                                new Date(
                                    createdAt.getTime() +
                                    72 * 60 * 60_000,
                                ),
                        },
                    ),
                ).resolves.toBeNull();
            },
        );

        it(
            "enforces hash format at the database boundary",
            async () => {
                const createdAt =
                    new Date();

                await expect(
                    testPrisma
                        .accountAssistanceRequest
                        .create({
                            data: {
                                tenantId:
                                    activeTenantId,
                                referenceHash:
                                    "raw-reference",
                                expiresAt:
                                    new Date(
                                        createdAt.getTime() +
                                        60_000,
                                    ),
                                createdAt,
                            },
                        }),
                ).rejects.toThrow();
            },
        );

        it(
            "enforces expiry after creation",
            async () => {
                const createdAt =
                    new Date();

                await expect(
                    testPrisma
                        .accountAssistanceRequest
                        .create({
                            data: {
                                tenantId:
                                    activeTenantId,
                                referenceHash:
                                    "d".repeat(64),
                                expiresAt:
                                    createdAt,
                                createdAt,
                            },
                        }),
                ).rejects.toThrow();
            },
        );
    },
);

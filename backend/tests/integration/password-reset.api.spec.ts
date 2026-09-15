import {
    randomUUID,
} from "node:crypto";
import request from "supertest";
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";

import app from "../../src/app";
import {
    getConsumerTenantSlug,
} from "../../src/config/consumer-tenant.config";
import {
    passwordSecurity,
} from "../../src/security/bcrypt";
import {
    hashPasswordResetToken,
} from "../../src/security/password-reset-token.security";
import {
    testPrisma,
} from "../helpers/prisma-test.client";
import {
    hashTestPassword,
} from "../helpers/password.helper";

const consumerSlug =
    getConsumerTenantSlug();

const email =
    `password-reset-api-${randomUUID()}@titan.test`;

const originalPassword =
    "OriginalPassword123!";

let tenantId: string;
let userId: string;
let createdTenant = false;

beforeAll(async () => {
    let tenant =
        await testPrisma.tenant.findUnique({
            where: {
                slug:
                    consumerSlug,
            },
        });

    if (!tenant) {
        tenant =
            await testPrisma.tenant.create({
                data: {
                    name:
                        "Password Reset API Consumer",
                    slug:
                        consumerSlug,
                },
            });

        createdTenant = true;
    }

    tenantId = tenant.id;

    const user =
        await testPrisma.user.create({
            data: {
                tenantId,
                email,
                passwordHash:
                    await hashTestPassword(
                        originalPassword,
                    ),
                status:
                    "ACTIVE",
            },
        });

    userId = user.id;
});

afterAll(async () => {
    await testPrisma.session.deleteMany({
        where: {
            userId,
        },
    });

    await testPrisma.passwordResetToken
        .deleteMany({
            where: {
                userId,
                tenantId,
            },
        });

    await testPrisma.user.delete({
        where: {
            id:
                userId,
        },
    });

    if (createdTenant) {
        await testPrisma.tenant.delete({
            where: {
                id:
                    tenantId,
            },
        });
    }
});

describe(
    "Password reset HTTP boundary",
    () => {
        it(
            "returns the same generic response for existing and missing accounts",
            async () => {
                const existing =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/request",
                        )
                        .send({
                            email:
                                email.toUpperCase(),
                        });

                const missing =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/request",
                        )
                        .send({
                            email:
                                `missing-${randomUUID()}@titan.test`,
                        });

                expect(existing.status)
                    .toBe(202);
                expect(missing.status)
                    .toBe(202);
                expect(existing.body)
                    .toEqual(missing.body);
                expect(existing.headers[
                    "cache-control"
                ]).toContain("no-store");
                expect(
                    JSON.stringify(
                        existing.body,
                    ),
                ).not.toMatch(
                    /token/i,
                );

                expect(
                    await testPrisma
                        .passwordResetToken
                        .count({
                            where: {
                                userId,
                                consumedAt:
                                    null,
                                revokedAt:
                                    null,
                            },
                        }),
                ).toBe(0);
            },
        );

        it(
            "rejects unknown authority fields",
            async () => {
                const requestResult =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/request",
                        )
                        .send({
                            email,
                            tenantId,
                        });

                const completionResult =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/complete",
                        )
                        .send({
                            token:
                                "A".repeat(43),
                            newPassword:
                                "ReplacementPassword123!",
                            role:
                                "ADMIN",
                        });

                expect(requestResult.status)
                    .toBe(400);
                expect(completionResult.status)
                    .toBe(400);
                expect(requestResult.headers[
                    "cache-control"
                ]).toContain("no-store");
                expect(completionResult.headers[
                    "cache-control"
                ]).toContain("no-store");
            },
        );

        it(
            "resets the password once and revokes every active session",
            async () => {
                const rawToken =
                    "B".repeat(43);

                const issuedAt =
                    new Date();

                await testPrisma
                    .passwordResetToken
                    .create({
                        data: {
                            tenantId,
                            userId,
                            tokenHash:
                                hashPasswordResetToken(
                                    rawToken,
                                ),
                            createdAt:
                                issuedAt,
                            expiresAt:
                                new Date(
                                    issuedAt.getTime() +
                                    15 * 60_000,
                                ),
                        },
                    });

                await testPrisma.session
                    .createMany({
                        data: [
                            {
                                userId,
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
                                userId,
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

                const newPassword =
                    "ReplacementPassword123!";

                const completed =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/complete",
                        )
                        .send({
                            token:
                                rawToken,
                            newPassword,
                        });

                expect(completed.status)
                    .toBe(200);
                expect(completed.headers[
                    "cache-control"
                ]).toContain("no-store");

                const user =
                    await testPrisma.user
                        .findUniqueOrThrow({
                            where: {
                                id:
                                    userId,
                            },
                        });

                await expect(
                    passwordSecurity.verify(
                        newPassword,
                        user.passwordHash,
                    ),
                ).resolves.toBe(true);

                await expect(
                    passwordSecurity.verify(
                        originalPassword,
                        user.passwordHash,
                    ),
                ).resolves.toBe(false);

                expect(
                    await testPrisma.session.count({
                        where: {
                            userId,
                            status:
                                "ACTIVE",
                        },
                    }),
                ).toBe(0);

                const reused =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/complete",
                        )
                        .send({
                            token:
                                rawToken,
                            newPassword:
                                "AnotherPassword123!",
                        });

                expect(reused.status)
                    .toBe(400);
                expect(reused.body.message)
                    .toBe(
                        "Password reset token is invalid or expired.",
                    );
            },
        );

        it(
            "safely rejects malformed tokens and weak passwords",
            async () => {
                const malformed =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/complete",
                        )
                        .send({
                            token:
                                "invalid",
                            newPassword:
                                "Password123!",
                        });

                const weakPassword =
                    await request(app)
                        .post(
                            "/api/v1/auth/password-reset/complete",
                        )
                        .send({
                            token:
                                "C".repeat(43),
                            newPassword:
                                "short",
                        });

                expect(malformed.status)
                    .toBe(400);
                expect(weakPassword.status)
                    .toBe(400);
                expect(malformed.body.message)
                    .toBe(
                        "Password reset token is invalid or expired.",
                    );
                expect(weakPassword.body.message)
                    .toBe(
                        "Password must be at least 8 characters.",
                    );
            },
        );
    },
);

import { randomUUID } from "node:crypto";

import {
    afterAll,
    describe,
    expect,
    it,
} from "vitest";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import {
    OrganisationPaymentEventVerifier,
    VerifiedOrganisationPaymentEvent,
    VerifiedOrganisationPaymentEventService,
} from "../../src/infrastructure/onboarding/verified-organisation-payment-event.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database =
    new DatabaseService();

const planIds: string[] = [];
const applicationIds: string[] = [];
const attemptIds: string[] = [];

let verified:
    VerifiedOrganisationPaymentEvent;

const verifier:
    OrganisationPaymentEventVerifier = {
    async verify(
        _raw,
        signature,
    ) {
        if(
            signature !==
            "valid-test-signature"
        ) {
            throw new Error(
                "Invalid provider signature.",
            );
        }

        return verified;
    },
};

const processor =
    new VerifiedOrganisationPaymentEventService(
        database,
        verifier,
    );

const body =
    new TextEncoder().encode(
        "signed-organisation-payment-event",
    );

async function preparedAttempt() {
    const plan =
        await testPrisma.organisationOnboardingPlan.create({
            data: {
                code:
                    `verified-${randomUUID()}`,
                name:
                    "Verified organisation plan",
                amountMinor:
                    59900,
                currency:
                    "ZAR",
                billingInterval:
                    "MONTHLY",
                status:
                    "ACTIVE",
            },
        });

    planIds.push(
        plan.id,
    );

    const application =
        await testPrisma.organisationOnboardingApplication.create({
            data: {
                requestId:
                    randomUUID(),
                organisationName:
                    "TITAN Verified Organisation",
                organisationSlug:
                    `titan-verified-${randomUUID()}`,
                administratorEmail:
                    `admin-${randomUUID()}@example.test`,
                planId:
                    plan.id,
                amountMinor:
                    59900,
                currency:
                    "ZAR",
                billingInterval:
                    "MONTHLY",
                status:
                    "PENDING_PAYMENT",
                expiresAt:
                    new Date(
                        Date.now() +
                        60 * 60 * 1000,
                    ),
            },
        });

    applicationIds.push(
        application.id,
    );

    const sessionReference =
        `session-${randomUUID()}`;

    const attempt =
        await testPrisma.organisationOnboardingPaymentAttempt.create({
            data: {
                applicationId:
                    application.id,
                requestId:
                    randomUUID(),
                provider:
                    "FAKE",
                amountMinor:
                    59900,
                currency:
                    "ZAR",
                billingInterval:
                    "MONTHLY",
                status:
                    "SESSION_CREATED",
                providerSessionReference:
                    sessionReference,
                sessionExpiresAt:
                    new Date(
                        Date.now() +
                        30 * 60 * 1000,
                    ),
            },
        });

    attemptIds.push(
        attempt.id,
    );

    return {
        application,
        attempt,
        sessionReference,
    };
}

function event(
    attemptId: string,
    sessionReference: string,
    transactionReference: string,
    outcome:
        VerifiedOrganisationPaymentEvent["outcome"] =
        "CONFIRMED",
): VerifiedOrganisationPaymentEvent {
    return {
        provider:
            "FAKE",
        attemptId,
        providerSessionReference:
            sessionReference,
        providerTransactionReference:
            transactionReference,
        amountMinor:
            59900,
        currency:
            "ZAR",
        billingInterval:
            "MONTHLY",
        outcome,
    };
}

afterAll(async () => {
    await testPrisma.organisationOnboardingPaymentAttempt.deleteMany({
        where: {
            id: {
                in:
                    attemptIds,
            },
        },
    });

    await testPrisma.organisationOnboardingApplication.deleteMany({
        where: {
            id: {
                in:
                    applicationIds,
            },
        },
    });

    await testPrisma.organisationOnboardingPlan.deleteMany({
        where: {
            id: {
                in:
                    planIds,
            },
        },
    });
});

describe(
    "Verified organisation payment event",
    () => {
        it(
            "atomically confirms payment and marks the application ready for provisioning",
            async () => {
                const prepared =
                    await preparedAttempt();

                const reference =
                    `transaction-${randomUUID()}`;

                verified =
                    event(
                        prepared.attempt.id,
                        prepared.sessionReference,
                        reference,
                    );

                const before = {
                    tenants:
                        await testPrisma.tenant.count(),
                    users:
                        await testPrisma.user.count(),
                };

                const first =
                    await processor.process(
                        body,
                        "valid-test-signature",
                    );

                const second =
                    await processor.process(
                        body,
                        "valid-test-signature",
                    );

                expect(second).toEqual(
                    first,
                );

                expect(first.status).toBe(
                    "PAYMENT_CONFIRMED",
                );

                const attempt =
                    await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                        where: {
                            id:
                                prepared.attempt.id,
                        },
                    });

                expect(attempt).toMatchObject({
                    status:
                        "CONFIRMED",
                    providerTransactionReference:
                        reference,
                });

                expect(
                    attempt.confirmedAt,
                ).not.toBeNull();

                const application =
                    await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({
                        where: {
                            id:
                                prepared.application.id,
                        },
                    });

                expect(
                    application.status,
                ).toBe(
                    "PAYMENT_CONFIRMED",
                );

                expect(
                    await testPrisma.tenant.count(),
                ).toBe(
                    before.tenants,
                );

                expect(
                    await testPrisma.user.count(),
                ).toBe(
                    before.users,
                );
            },
        );

        it(
            "handles concurrent duplicate confirmed provider events idempotently",
            async () => {
                const prepared =
                    await preparedAttempt();

                const reference =
                    `transaction-${randomUUID()}`;

                verified =
                    event(
                        prepared.attempt.id,
                        prepared.sessionReference,
                        reference,
                    );

                const [first, second] =
                    await Promise.all([
                        processor.process(
                            body,
                            "valid-test-signature",
                        ),
                        processor.process(
                            body,
                            "valid-test-signature",
                        ),
                    ]);

                expect(second).toEqual(
                    first,
                );

                expect(first.status).toBe(
                    "PAYMENT_CONFIRMED",
                );

                const attempt =
                    await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                        where: {
                            id:
                                prepared.attempt.id,
                        },
                    });

                expect(attempt).toMatchObject({
                    status:
                        "CONFIRMED",
                    providerTransactionReference:
                        reference,
                });

                const application =
                    await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({
                        where: {
                            id:
                                prepared.application.id,
                        },
                    });

                expect(
                    application.status,
                ).toBe(
                    "PAYMENT_CONFIRMED",
                );
            },
        );
        it(
            "rejects bad signatures and immutable-snapshot mismatches without confirming",
            async () => {
                const prepared =
                    await preparedAttempt();

                verified =
                    event(
                        prepared.attempt.id,
                        prepared.sessionReference,
                        `transaction-${randomUUID()}`,
                    );

                await expect(
                    processor.process(
                        body,
                        "invalid",
                    ),
                ).rejects.toThrow(
                    "Invalid provider signature.",
                );

                verified = {
                    ...verified,
                    amountMinor:
                        1,
                };

                await expect(
                    processor.process(
                        body,
                        "valid-test-signature",
                    ),
                ).rejects.toThrow(
                    "immutable snapshot",
                );

                expect(
                    (
                        await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                            where: {
                                id:
                                    prepared.attempt.id,
                            },
                        })
                    ).status,
                ).toBe(
                    "SESSION_CREATED",
                );

                expect(
                    (
                        await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({
                            where: {
                                id:
                                    prepared.application.id,
                            },
                        })
                    ).status,
                ).toBe(
                    "PENDING_PAYMENT",
                );
            },
        );

        it(
            "records failure without advancing the onboarding application",
            async () => {
                const prepared =
                    await preparedAttempt();

                verified =
                    event(
                        prepared.attempt.id,
                        prepared.sessionReference,
                        `transaction-${randomUUID()}`,
                        "FAILED",
                    );

                expect(
                    await processor.process(
                        body,
                        "valid-test-signature",
                    ),
                ).toMatchObject({
                    status:
                        "FAILED",
                });

                expect(
                    (
                        await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                            where: {
                                id:
                                    prepared.attempt.id,
                            },
                        })
                    ).status,
                ).toBe(
                    "FAILED",
                );

                expect(
                    (
                        await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({
                            where: {
                                id:
                                    prepared.application.id,
                            },
                        })
                    ).status,
                ).toBe(
                    "PENDING_PAYMENT",
                );
            },
        );

        it(
            "rejects reuse of one provider transaction across different attempts",
            async () => {
                const first =
                    await preparedAttempt();

                const second =
                    await preparedAttempt();

                const transactionReference =
                    `transaction-${randomUUID()}`;

                verified =
                    event(
                        first.attempt.id,
                        first.sessionReference,
                        transactionReference,
                    );

                await processor.process(
                    body,
                    "valid-test-signature",
                );

                verified =
                    event(
                        second.attempt.id,
                        second.sessionReference,
                        transactionReference,
                    );

                await expect(
                    processor.process(
                        body,
                        "valid-test-signature",
                    ),
                ).rejects.toThrow(
                    "already used",
                );

                expect(
                    (
                        await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                            where: {
                                id:
                                    second.attempt.id,
                            },
                        })
                    ).status,
                ).toBe(
                    "SESSION_CREATED",
                );

                expect(
                    (
                        await testPrisma.organisationOnboardingApplication.findUniqueOrThrow({
                            where: {
                                id:
                                    second.application.id,
                            },
                        })
                    ).status,
                ).toBe(
                    "PENDING_PAYMENT",
                );
            },
        );
    },
);
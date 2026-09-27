import { randomUUID } from "node:crypto";

import {
    afterAll,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { DatabaseService } from "../../src/infrastructure/database/database.service";
import {
    OrganisationHostedCheckoutProvider,
    OrganisationOnboardingCheckoutService,
} from "../../src/infrastructure/onboarding/organisation-onboarding-checkout.service";
import { OrganisationRegistrationService } from "../../src/infrastructure/onboarding/organisation-registration.service";
import { testPrisma } from "../helpers/prisma-test.client";

const database =
    new DatabaseService();

const registration =
    new OrganisationRegistrationService(
        database,
    );

const planIds: string[] = [];
const applicationIds: string[] = [];
const attemptRequestIds: string[] = [];

async function createApplication(
    status:
        | "PENDING_VERIFICATION"
        | "PENDING_PAYMENT" =
        "PENDING_PAYMENT",
) {
    const plan =
        await testPrisma.organisationOnboardingPlan.create({
            data: {
                code:
                    `checkout-${randomUUID()}`,
                name:
                    "Organisation checkout plan",
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
        await registration.prepare({
            requestId:
                randomUUID(),
            organisationName:
                "TITAN Athletics",
            administratorEmail:
                `admin-${randomUUID()}@example.test`,
            planId:
                plan.id,
        });

    applicationIds.push(
        application.id,
    );

    if(
        status !==
        "PENDING_VERIFICATION"
    ) {
        return testPrisma.organisationOnboardingApplication.update({
            where: {
                id: application.id,
            },
            data: {
                status,
            },
        });
    }

    return application;
}

function provider() {
    const hosted:
        OrganisationHostedCheckoutProvider = {
        code:
            "FAKE",
        createOrResume:
            vi.fn().mockImplementation(
                async input => ({
                    sessionReference:
                        `session-${input.attemptId}`,
                    redirectUrl:
                        `https://checkout.example.test/session/${input.attemptId}`,
                    expiresAt:
                        new Date(
                            Date.now() +
                            30 * 60 * 1000,
                        ),
                }),
            ),
    };

    return hosted;
}

afterAll(async () => {
    await testPrisma.organisationOnboardingPaymentAttempt.deleteMany({
        where: {
            requestId: {
                in:
                    attemptRequestIds,
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
    "Organisation pre-tenant checkout",
    () => {
        it(
            "creates one immutable hosted-payment attempt without provisioning access",
            async () => {
                const application =
                    await createApplication();

                const requestId =
                    randomUUID();

                attemptRequestIds.push(
                    requestId,
                );

                const hosted =
                    provider();

                const service =
                    new OrganisationOnboardingCheckoutService(
                        database,
                        hosted,
                        [
                            "https://checkout.example.test",
                        ],
                    );

                const before = {
                    tenants:
                        await testPrisma.tenant.count(),
                    users:
                        await testPrisma.user.count(),
                };

                const first =
                    await service.prepare({
                        applicationId:
                            application.id,
                        requestId,
                    });

                const again =
                    await service.prepare({
                        applicationId:
                            application.id,
                        requestId,
                    });

                expect(
                    again.attemptId,
                ).toBe(
                    first.attemptId,
                );

                expect(
                    await testPrisma.organisationOnboardingPaymentAttempt.count({
                        where: {
                            requestId,
                        },
                    }),
                ).toBe(1);

                const stored =
                    await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                        where: {
                            requestId,
                        },
                    });

                expect(stored).toMatchObject({
                    applicationId:
                        application.id,
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
                });

                expect(
                    vi.mocked(
                        hosted.createOrResume,
                    ).mock.calls[0][0].attemptId,
                ).toBe(
                    vi.mocked(
                        hosted.createOrResume,
                    ).mock.calls[1][0].attemptId,
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
            "keeps concurrent checkout requests on one durable attempt",
            async () => {
                const application =
                    await createApplication();

                const requestId =
                    randomUUID();

                attemptRequestIds.push(
                    requestId,
                );

                const hosted =
                    provider();

                const service =
                    new OrganisationOnboardingCheckoutService(
                        database,
                        hosted,
                        [
                            "https://checkout.example.test",
                        ],
                    );

                const [first, second] =
                    await Promise.all([
                        service.prepare({
                            applicationId:
                                application.id,
                            requestId,
                        }),
                        service.prepare({
                            applicationId:
                                application.id,
                            requestId,
                        }),
                    ]);

                expect(
                    second.attemptId,
                ).toBe(
                    first.attemptId,
                );

                expect(
                    await testPrisma.organisationOnboardingPaymentAttempt.count({
                        where: {
                            requestId,
                        },
                    }),
                ).toBe(1);

                const stored =
                    await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                        where: {
                            requestId,
                        },
                    });

                expect(stored).toMatchObject({
                    applicationId:
                        application.id,
                    amountMinor:
                        59900,
                    currency:
                        "ZAR",
                    billingInterval:
                        "MONTHLY",
                    status:
                        "SESSION_CREATED",
                });

                expect(
                    stored.providerTransactionReference,
                ).toBeNull();

                expect(
                    stored.confirmedAt,
                ).toBeNull();

                for(
                    const call of
                    vi.mocked(
                        hosted.createOrResume,
                    ).mock.calls
                ) {
                    expect(
                        call[0].attemptId,
                    ).toBe(
                        first.attemptId,
                    );
                }
            },
        );
        it(
            "does not allow checkout before the application reaches payment state",
            async () => {
                const application =
                    await createApplication(
                        "PENDING_VERIFICATION",
                    );

                const requestId =
                    randomUUID();

                attemptRequestIds.push(
                    requestId,
                );

                const hosted =
                    provider();

                const service =
                    new OrganisationOnboardingCheckoutService(
                        database,
                        hosted,
                        [
                            "https://checkout.example.test",
                        ],
                    );

                await expect(
                    service.prepare({
                        applicationId:
                            application.id,
                        requestId,
                    }),
                ).rejects.toThrow(
                    "not ready for payment",
                );

                expect(
                    hosted.createOrResume,
                ).not.toHaveBeenCalled();

                expect(
                    await testPrisma.organisationOnboardingPaymentAttempt.count({
                        where: {
                            requestId,
                        },
                    }),
                ).toBe(0);
            },
        );

        it(
            "rejects an unapproved provider redirect and leaves the attempt unconfirmed",
            async () => {
                const application =
                    await createApplication();

                const requestId =
                    randomUUID();

                attemptRequestIds.push(
                    requestId,
                );

                const hosted =
                    provider();

                vi.mocked(
                    hosted.createOrResume,
                ).mockResolvedValue({
                    sessionReference:
                        `session-${randomUUID()}`,
                    redirectUrl:
                        "https://evil.example.test/session",
                    expiresAt:
                        new Date(
                            Date.now() +
                            30 * 60 * 1000,
                        ),
                });

                const service =
                    new OrganisationOnboardingCheckoutService(
                        database,
                        hosted,
                        [
                            "https://checkout.example.test",
                        ],
                    );

                await expect(
                    service.prepare({
                        applicationId:
                            application.id,
                        requestId,
                    }),
                ).rejects.toThrow(
                    "not approved",
                );

                const stored =
                    await testPrisma.organisationOnboardingPaymentAttempt.findUniqueOrThrow({
                        where: {
                            requestId,
                        },
                    });

                expect(
                    stored.status,
                ).toBe(
                    "PENDING",
                );

                expect(
                    stored.providerSessionReference,
                ).toBeNull();

                expect(
                    stored.confirmedAt,
                ).toBeNull();
            },
        );

        it(
            "rejects checkout for an expired onboarding application",
            async () => {
                const application =
                    await createApplication();

                await testPrisma.organisationOnboardingApplication.update({
                    where: {
                        id:
                            application.id,
                    },
                    data: {
                        expiresAt:
                            new Date(
                                Date.now() -
                                1000,
                            ),
                    },
                });

                const requestId =
                    randomUUID();

                attemptRequestIds.push(
                    requestId,
                );

                const hosted =
                    provider();

                const service =
                    new OrganisationOnboardingCheckoutService(
                        database,
                        hosted,
                        [
                            "https://checkout.example.test",
                        ],
                    );

                await expect(
                    service.prepare({
                        applicationId:
                            application.id,
                        requestId,
                    }),
                ).rejects.toThrow(
                    "expired",
                );

                expect(
                    hosted.createOrResume,
                ).not.toHaveBeenCalled();
            },
        );
    },
);

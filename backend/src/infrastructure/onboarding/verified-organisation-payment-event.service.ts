import { DatabaseService } from "../database/database.service";

export type VerifiedOrganisationPaymentOutcome =
    "CONFIRMED" |
    "FAILED" |
    "CANCELLED";

export interface VerifiedOrganisationPaymentEvent {
    provider: string;
    attemptId: string;
    providerSessionReference: string;
    providerTransactionReference: string;
    amountMinor: number;
    currency: string;
    billingInterval: "MONTHLY" | "ANNUALLY";
    outcome: VerifiedOrganisationPaymentOutcome;
}

export interface OrganisationPaymentEventVerifier {
    /**
     * Implementations MUST authenticate the exact raw
     * provider payload before returning parsed event data.
     */
    verify(
        rawPayload: Uint8Array,
        signature: string,
    ): Promise<VerifiedOrganisationPaymentEvent>;
}

/**
 * Provider-verified pre-tenant payment boundary.
 *
 * This service never provisions a tenant, creates an
 * administrator, or grants application access.
 */
export class VerifiedOrganisationPaymentEventService {
    constructor(
        private readonly database: DatabaseService,
        private readonly verifier: OrganisationPaymentEventVerifier,
    ) {}

    async process(
        rawPayload: Uint8Array,
        signature: string,
    ) {
        if(
            !rawPayload?.length ||
            !signature?.trim()
        ) {
            throw new Error(
                "Signed provider payload is required.",
            );
        }

        const event =
            await this.verifier.verify(
                rawPayload,
                signature,
            );

        const provider =
            event.provider?.trim().toUpperCase();

        if(
            !/^[A-Z0-9_-]{2,40}$/.test(provider) ||
            !this.isUuid(event.attemptId) ||
            !event.providerSessionReference?.trim() ||
            event.providerSessionReference.trim().length > 255 ||
            !event.providerTransactionReference?.trim() ||
            event.providerTransactionReference.trim().length > 255 ||
            !Number.isSafeInteger(event.amountMinor) ||
            event.amountMinor <= 0 ||
            !/^[A-Z]{3}$/.test(event.currency) ||
            !["MONTHLY", "ANNUALLY"].includes(
                event.billingInterval,
            ) ||
            !["CONFIRMED", "FAILED", "CANCELLED"].includes(
                event.outcome,
            )
        ) {
            throw new Error(
                "Verified organisation payment event is invalid.",
            );
        }

        const sessionReference =
            event.providerSessionReference.trim();

        const transactionReference =
            event.providerTransactionReference.trim();

        const attempt =
            await this.database.prisma.organisationOnboardingPaymentAttempt.findUnique({
                where: {
                    id: event.attemptId,
                },
                include: {
                    application: true,
                },
            });

        if(
            !attempt ||
            attempt.provider !== provider ||
            attempt.providerSessionReference !== sessionReference ||
            attempt.amountMinor !== event.amountMinor ||
            attempt.currency !== event.currency ||
            attempt.billingInterval !== event.billingInterval ||
            attempt.application.amountMinor !== attempt.amountMinor ||
            attempt.application.currency !== attempt.currency ||
            attempt.application.billingInterval !== attempt.billingInterval
        ) {
            throw new Error(
                "Verified organisation payment does not match its immutable snapshot.",
            );
        }

        if(event.outcome === "CONFIRMED") {
            if(
                attempt.application.expiresAt.getTime() <=
                Date.now()
            ) {
                throw new Error(
                    "Organisation onboarding application has expired.",
                );
            }

            return this.database.prisma.$transaction(
                async transaction => {
                    const current =
                        await transaction.organisationOnboardingPaymentAttempt.findUnique({
                            where: {
                                id: attempt.id,
                            },
                            include: {
                                application: true,
                            },
                        });

                    if(!current) {
                        throw new Error(
                            "Organisation payment attempt was not found.",
                        );
                    }

                    if(
                        current.status === "CONFIRMED"
                    ) {
                        if(
                            current.providerTransactionReference !==
                                transactionReference ||
                            current.application.status !==
                                "PAYMENT_CONFIRMED"
                        ) {
                            throw new Error(
                                "Organisation payment is not confirmable with this provider reference.",
                            );
                        }

                        return {
                            status: "PAYMENT_CONFIRMED" as const,
                            applicationId:
                                current.applicationId,
                            attemptId:
                                current.id,
                        };
                    }

                    if(
                        current.status !==
                        "SESSION_CREATED" ||
                        current.application.status !==
                        "PENDING_PAYMENT"
                    ) {
                        throw new Error(
                            "Organisation payment state is not confirmable.",
                        );
                    }

                    const duplicate =
                        await transaction.organisationOnboardingPaymentAttempt.findFirst({
                            where: {
                                provider,
                                providerTransactionReference:
                                    transactionReference,
                                id: {
                                    not:
                                        current.id,
                                },
                            },
                            select: {
                                id: true,
                            },
                        });

                    if(duplicate) {
                        throw new Error(
                            "Provider transaction reference was already used.",
                        );
                    }

                    const now =
                        new Date();

                    const paymentChanged =
                        await transaction.organisationOnboardingPaymentAttempt.updateMany({
                            where: {
                                id:
                                    current.id,
                                status:
                                    "SESSION_CREATED",
                                providerSessionReference:
                                    sessionReference,
                            },
                            data: {
                                status:
                                    "CONFIRMED",
                                providerTransactionReference:
                                    transactionReference,
                                confirmedAt:
                                    now,
                            },
                        });

                    if(
                        paymentChanged.count !== 1
                    ) {
                        const settled =
                            await transaction.organisationOnboardingPaymentAttempt.findUnique({
                                where: {
                                    id:
                                        current.id,
                                },
                                include: {
                                    application:
                                        true,
                                },
                            });

                        if(
                            settled?.status ===
                                "CONFIRMED" &&
                            settled.providerTransactionReference ===
                                transactionReference &&
                            settled.application.status ===
                                "PAYMENT_CONFIRMED"
                        ) {
                            return {
                                status:
                                    "PAYMENT_CONFIRMED" as const,
                                applicationId:
                                    settled.applicationId,
                                attemptId:
                                    settled.id,
                            };
                        }

                        throw new Error(
                            "Organisation payment state changed during confirmation.",
                        );
                    }

                    const applicationChanged =
                        await transaction.organisationOnboardingApplication.updateMany({
                            where: {
                                id:
                                    current.applicationId,
                                status:
                                    "PENDING_PAYMENT",
                            },
                            data: {
                                status:
                                    "PAYMENT_CONFIRMED",
                            },
                        });

                    if(
                        applicationChanged.count !== 1
                    ) {
                        throw new Error(
                            "Organisation onboarding state changed during payment confirmation.",
                        );
                    }

                    return {
                        status:
                            "PAYMENT_CONFIRMED" as const,
                        applicationId:
                            current.applicationId,
                        attemptId:
                            current.id,
                    };
                },
            );
        }

        if(
            attempt.status === event.outcome
        ) {
            return {
                status:
                    event.outcome,
                applicationId:
                    attempt.applicationId,
                attemptId:
                    attempt.id,
            };
        }

        if(
            attempt.status !==
            "SESSION_CREATED"
        ) {
            throw new Error(
                "Organisation payment state transition is invalid.",
            );
        }

        const changed =
            await this.database.prisma.organisationOnboardingPaymentAttempt.updateMany({
                where: {
                    id:
                        attempt.id,
                    status:
                        "SESSION_CREATED",
                },
                data: {
                    status:
                        event.outcome,
                },
            });

        if(changed.count !== 1) {
            throw new Error(
                "Organisation payment state changed during provider outcome processing.",
            );
        }

        // FAILED/CANCELLED does not provision, activate,
        // or advance the onboarding application.
        return {
            status:
                event.outcome,
            applicationId:
                attempt.applicationId,
            attemptId:
                attempt.id,
        };
    }

    private isUuid(
        value: string,
    ): boolean {
        return (
            typeof value === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value,
            )
        );
    }
}
import { DatabaseService } from "../database/database.service";

export interface OrganisationHostedCheckoutProvider {
    readonly code: string;

    createOrResume(input: {
        attemptId: string;
        applicationId: string;
        amountMinor: number;
        currency: string;
        billingInterval: "MONTHLY" | "ANNUALLY";
        applicationExpiresAt: Date;
    }): Promise<{
        sessionReference: string;
        redirectUrl: string;
        expiresAt: Date;
    }>;
}

/**
 * Pre-tenant hosted-checkout boundary.
 *
 * A created provider session is NOT payment confirmation
 * and MUST NOT grant access, provision a tenant, or create
 * an administrator.
 */
export class OrganisationOnboardingCheckoutService {
    private readonly allowedOrigins: Set<string>;
    private readonly providerCode: string;

    constructor(
        private readonly database: DatabaseService,
        private readonly provider: OrganisationHostedCheckoutProvider,
        allowedRedirectOrigins: readonly string[],
    ) {
        this.providerCode = provider.code.trim().toUpperCase();

        if(!/^[A-Z0-9_-]{2,40}$/.test(this.providerCode)) {
            throw new Error("Hosted checkout provider code is invalid.");
        }

        this.allowedOrigins = new Set(
            allowedRedirectOrigins.map(value => {
                const url = new URL(value);

                if(url.protocol !== "https:") {
                    throw new Error("Checkout redirect origins must use HTTPS.");
                }

                return url.origin;
            }),
        );

        if(this.allowedOrigins.size === 0) {
            throw new Error("At least one checkout redirect origin is required.");
        }
    }

    async prepare(input: {
        applicationId: string;
        requestId: string;
    }) {
        this.requireUuid(
            input?.applicationId,
            "application",
        );

        this.requireUuid(
            input?.requestId,
            "checkout request",
        );

        const application =
            await this.database.prisma.organisationOnboardingApplication.findUnique({
                where: {
                    id: input.applicationId,
                },
            });

        if(!application) {
            throw new Error("Organisation onboarding application was not found.");
        }

        if(application.expiresAt.getTime() <= Date.now()) {
            throw new Error("Organisation onboarding application has expired.");
        }

        if(application.status !== "PENDING_PAYMENT") {
            throw new Error(
                "Organisation onboarding application is not ready for payment.",
            );
        }

        if(
            !Number.isSafeInteger(application.amountMinor) ||
            application.amountMinor <= 0 ||
            !/^[A-Z]{3}$/.test(application.currency) ||
            !["MONTHLY", "ANNUALLY"].includes(application.billingInterval)
        ) {
            throw new Error("Organisation onboarding payment snapshot is invalid.");
        }

        let attempt =
            await this.database.prisma.organisationOnboardingPaymentAttempt.findUnique({
                where: {
                    requestId: input.requestId,
                },
            });

        if(attempt) {
            if(
                attempt.applicationId !== application.id ||
                attempt.provider !== this.providerCode ||
                attempt.amountMinor !== application.amountMinor ||
                attempt.currency !== application.currency ||
                attempt.billingInterval !== application.billingInterval
            ) {
                throw new Error("Checkout request ID was already used.");
            }

            if(
                !["PENDING", "SESSION_CREATED"].includes(
                    attempt.status,
                )
            ) {
                throw new Error("Checkout attempt is no longer available.");
            }
        } else {
            try {
                attempt =
                    await this.database.prisma.organisationOnboardingPaymentAttempt.create({
                        data: {
                            applicationId: application.id,
                            requestId: input.requestId,
                            provider: this.providerCode,
                            amountMinor: application.amountMinor,
                            currency: application.currency,
                            billingInterval: application.billingInterval,
                        },
                    });
            } catch(error) {
                if(
                    error &&
                    typeof error === "object" &&
                    "code" in error &&
                    error.code === "P2002"
                ) {
                    attempt =
                        await this.database.prisma.organisationOnboardingPaymentAttempt.findUnique({
                            where: {
                                requestId: input.requestId,
                            },
                        });

                    if(
                        !attempt ||
                        attempt.applicationId !== application.id ||
                        attempt.provider !== this.providerCode
                    ) {
                        throw new Error("Checkout request ID was already used.");
                    }
                } else {
                    throw error;
                }
            }
        }

        const checkout =
            await this.provider.createOrResume({
                attemptId: attempt.id,
                applicationId: application.id,
                amountMinor: attempt.amountMinor,
                currency: attempt.currency,
                billingInterval:
                    attempt.billingInterval as "MONTHLY" | "ANNUALLY",
                applicationExpiresAt:
                    application.expiresAt,
            });

        const sessionReference =
            checkout.sessionReference?.trim();

        if(
            !sessionReference ||
            sessionReference.length > 255
        ) {
            throw new Error(
                "Hosted checkout provider session reference is invalid.",
            );
        }

        let redirect: URL;

        try {
            redirect =
                new URL(checkout.redirectUrl);
        } catch {
            throw new Error(
                "Hosted checkout redirect URL is invalid.",
            );
        }

        if(
            redirect.protocol !== "https:" ||
            !this.allowedOrigins.has(
                redirect.origin,
            )
        ) {
            throw new Error(
                "Hosted checkout redirect origin is not approved.",
            );
        }

        if(
            !(checkout.expiresAt instanceof Date) ||
            Number.isNaN(
                checkout.expiresAt.getTime(),
            ) ||
            checkout.expiresAt.getTime() <= Date.now() ||
            checkout.expiresAt.getTime() >
                application.expiresAt.getTime()
        ) {
            throw new Error(
                "Hosted checkout expiry is invalid.",
            );
        }

        const updated =
            await this.database.prisma.organisationOnboardingPaymentAttempt.updateMany({
                where: {
                    id: attempt.id,
                    status: {
                        in: [
                            "PENDING",
                            "SESSION_CREATED",
                        ],
                    },
                },
                data: {
                    providerSessionReference:
                        sessionReference,
                    sessionExpiresAt:
                        checkout.expiresAt,
                    status:
                        "SESSION_CREATED",
                },
            });

        if(updated.count !== 1) {
            throw new Error(
                "Checkout attempt state changed before the provider session could be recorded.",
            );
        }

        return {
            attemptId:
                attempt.id,
            redirectUrl:
                redirect.toString(),
            status:
                "SESSION_CREATED" as const,
        };
    }

    private requireUuid(
        value: string,
        field: string,
    ) {
        if(
            typeof value !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value,
            )
        ) {
            throw new Error(
                `A valid ${field} ID is required.`,
            );
        }
    }
}

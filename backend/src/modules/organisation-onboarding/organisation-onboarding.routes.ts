import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";

import { DatabaseService } from "../../infrastructure/database/database.service";
import { OrganisationRegistrationService } from "../../infrastructure/onboarding/organisation-registration.service";
import {
    OrganisationEmailVerificationService,
    OrganisationVerificationEmailDelivery,
} from "../../infrastructure/onboarding/organisation-email-verification.service";
import { ResendOrganisationVerificationEmailDelivery } from "../../infrastructure/email/resend-organisation-verification-email-delivery";
import {
    OrganisationAdministratorSetupEmailDelivery,
    OrganisationAdministratorSetupService,
} from "../../infrastructure/onboarding/organisation-administrator-setup.service";
import { ResendOrganisationAdministratorSetupEmailDelivery } from "../../infrastructure/email/resend-organisation-administrator-setup-email-delivery";
import {
    getPasswordResetFrontendUrl,
    getResendPasswordResetConfig,
} from "../../config/password-reset.config";

const organisationRegistrationLimiter = rateLimit({
    windowMs: 60_000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many organisation registration attempts. Please try again later.",
    },
});

export function createOrganisationOnboardingRoutes(
    database: DatabaseService,
    verificationDelivery?: OrganisationVerificationEmailDelivery,
    administratorSetupDelivery?: OrganisationAdministratorSetupEmailDelivery,
) {
    const router = Router();
    const registrationService =
        new OrganisationRegistrationService(database);
    const emailConfig = verificationDelivery ? null : getResendPasswordResetConfig();
    const delivery = verificationDelivery ??
        (emailConfig
            ? new ResendOrganisationVerificationEmailDelivery(
                new Resend(emailConfig.apiKey),
                emailConfig.fromEmail,
            )
            : null);
    const verificationService = delivery
        ? new OrganisationEmailVerificationService(
            database,
            delivery,
            getPasswordResetFrontendUrl(),
        )
        : null;
    const setupEmailConfig = administratorSetupDelivery
        ? null
        : emailConfig ?? getResendPasswordResetConfig();
    const setupDelivery = administratorSetupDelivery ??
        (setupEmailConfig
            ? new ResendOrganisationAdministratorSetupEmailDelivery(
                new Resend(setupEmailConfig.apiKey),
                setupEmailConfig.fromEmail,
            )
            : null);
    const setupService = setupDelivery
        ? new OrganisationAdministratorSetupService(
            database,
            setupDelivery,
            getPasswordResetFrontendUrl(),
        )
        : null;

    router.get(
        "/plans",
        async (_request, response) => {
            try {
                const plans =
                    await database.prisma.organisationOnboardingPlan.findMany({
                        where: {
                            status: "ACTIVE",
                            billingInterval: {
                                in: [
                                    "MONTHLY",
                                    "ANNUALLY",
                                ],
                            },
                        },
                        orderBy: [
                            { amountMinor: "asc" },
                            { code: "asc" },
                        ],
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            amountMinor: true,
                            currency: true,
                            billingInterval: true,
                        },
                    });

                const safePlans = plans.filter(
                    plan =>
                        Number.isSafeInteger(plan.amountMinor) &&
                        plan.amountMinor > 0 &&
                        /^[A-Z]{3}$/.test(plan.currency),
                );

                response.setHeader(
                    "Cache-Control",
                    "no-store",
                );

                return response.status(200).json({
                    plans: safePlans,
                });
            } catch {
                return response.status(500).json({
                    message:
                        "Organisation plans are temporarily unavailable.",
                });
            }
        },
    );

    router.post(
        "/register",
        organisationRegistrationLimiter,
        async (request, response) => {
            try {
                const application =
                    await registrationService.prepare({
                        requestId:
                            request.body?.requestId,
                        organisationName:
                            request.body?.organisationName,
                        administratorEmail:
                            request.body?.administratorEmail,
                        planId:
                            request.body?.planId,
                    });
                if (application.status === "PENDING_VERIFICATION") {
                    if (!verificationService) {
                        return response.status(503).json({
                            message: "Organisation verification email is temporarily unavailable.",
                        });
                    }
                    await verificationService.issue(application.id);
                }

                response.setHeader(
                    "Cache-Control",
                    "no-store",
                );

                return response.status(201).json({
                    application: {
                        id: application.id,
                        requestId:
                            application.requestId,
                        organisationName:
                            application.organisationName,
                        administratorEmail:
                            application.administratorEmail,
                        planId:
                            application.planId,
                        amountMinor:
                            application.amountMinor,
                        currency:
                            application.currency,
                        billingInterval:
                            application.billingInterval,
                        status:
                            application.status,
                        expiresAt:
                            application.expiresAt,
                    },
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "";

                if(
                    message.includes(
                        "already used",
                    )
                ) {
                    return response.status(409).json({
                        message:
                            "Registration request ID was already used.",
                    });
                }

                if(
                    message.includes(
                        "invalid",
                    ) ||
                    message.includes(
                        "unavailable",
                    ) ||
                    message.includes(
                        "request ID",
                    )
                ) {
                    return response.status(400).json({
                        message,
                    });
                }

                return response.status(500).json({
                    message:
                        "Organisation registration could not be completed.",
                });
            }
        },
    );

    router.post(
        "/verify-email",
        organisationRegistrationLimiter,
        async (request, response) => {
            response.setHeader("Cache-Control", "no-store");
            if (!verificationService) {
                return response.status(503).json({
                    message: "Organisation email verification is temporarily unavailable.",
                });
            }
            try {
                const result = await verificationService.verify(request.body?.token);
                return response.status(200).json(result);
            } catch {
                return response.status(400).json({
                    message: "Verification token is invalid or expired.",
                });
            }
        },
    );

    router.post(
        "/request-administrator-setup",
        organisationRegistrationLimiter,
        async (request, response) => {
            response.setHeader("Cache-Control", "no-store");
            if (!setupService) {
                return response.status(503).json({
                    message: "Administrator setup email is temporarily unavailable.",
                });
            }
            try {
                await setupService.request(
                    request.body?.applicationId,
                    request.body?.administratorEmail,
                );
                return response.status(202).json({
                    message: "If the application is eligible, setup instructions will be emailed.",
                });
            } catch {
                return response.status(503).json({
                    message: "Administrator setup email is temporarily unavailable.",
                });
            }
        },
    );

    router.post(
        "/complete-administrator-setup",
        organisationRegistrationLimiter,
        async (request, response) => {
            response.setHeader("Cache-Control", "no-store");
            if (!setupService) {
                return response.status(503).json({
                    message: "Administrator setup is temporarily unavailable.",
                });
            }
            try {
                const result = await setupService.complete(
                    request.body?.token,
                    request.body?.newPassword,
                );
                return response.status(200).json(result);
            } catch {
                return response.status(400).json({
                    message: "Administrator setup is invalid or expired.",
                });
            }
        },
    );

    return router;
}

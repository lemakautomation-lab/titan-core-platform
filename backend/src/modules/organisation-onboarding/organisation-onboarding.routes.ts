import { Router } from "express";
import rateLimit from "express-rate-limit";

import { DatabaseService } from "../../infrastructure/database/database.service";
import { OrganisationRegistrationService } from "../../infrastructure/onboarding/organisation-registration.service";

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
) {
    const router = Router();
    const registrationService =
        new OrganisationRegistrationService(database);

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

    return router;
}

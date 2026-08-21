import { Request, Response } from "express";

import { SecurityAnalyticsService } from "../../application/services/security-analytics.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { ForbiddenException } from "../../shared/exceptions/forbidden.exception";

export class SecurityController {

    constructor(
        private readonly securityAnalyticsService: SecurityAnalyticsService,
    ) {}

    async analytics(
        req: Request,
        res: Response,
    ): Promise<void> {

        const authRequest =
            req as AuthRequest;

        const authenticatedUser =
            authRequest.user;

        if (!authenticatedUser) {
            throw new ForbiddenException(
                "Forbidden",
            );
        }

        const requestedTenantId =
            String(
                req.query.tenantId ?? "",
            ).trim();

        if (requestedTenantId) {

            if (
                requestedTenantId !==
                authenticatedUser.tenantId
            ) {

                throw new ForbiddenException(
                    "Forbidden",
                );
            }

        }

        const tenantId =
            authenticatedUser.tenantId;

        const result =
            await this.securityAnalyticsService
                .getSuspiciousAuthenticationActivity(
                    tenantId,
                );

        res.status(200).json(result);
    }
}

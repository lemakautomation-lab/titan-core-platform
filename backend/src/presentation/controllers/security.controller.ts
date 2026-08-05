import { Request, Response } from "express";

import { SecurityAnalyticsService } from "../../application/services/security-analytics.service";


export class SecurityController {


    constructor(
        private readonly securityAnalyticsService: SecurityAnalyticsService,
    ) {}



    async analytics(
        req: Request,
        res: Response,
    ): Promise<void> {


        const tenantId =

            String(req.query.tenantId ?? "");



        if (!tenantId) {

            res.status(400).json({

                error:
                    "tenantId query parameter is required.",

            });

            return;

        }



        const result =

            await this.securityAnalyticsService
                .getSuspiciousAuthenticationActivity(
                    tenantId,
                );



        res.status(200).json(result);

    }


}

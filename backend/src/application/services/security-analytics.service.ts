import { SecurityEventRepository } from "../../domain/repositories/security-event.repository";
import { SecurityEventType } from "../../domain/security/security-event-type";
import { SecurityMonitoringConfig } from "../../config/security-monitoring.config";


export class SecurityAnalyticsService {


    constructor(
        private readonly securityEventRepository: SecurityEventRepository,
    ) {}


    private getWindowStart(
        minutes = SecurityMonitoringConfig.failedLogin.windowMinutes,
    ): Date {

        return new Date(
            Date.now() -
            minutes * 60 * 1000,
        );

    }


    async getFailedLoginCountByEmail(

        tenantId: string,

        email: string,

    ): Promise<number> {


        const events =

            await this.securityEventRepository.findMany({

                tenantId,

                eventType:
                    SecurityEventType.AUTHENTICATION_FAILURE,

                from:
                    this.getWindowStart(),

            });


        const normalizedEmail =

            email.trim().toLowerCase();


        return events.filter(event => {

            const metadata =

                (event.metadata ?? {}) as Record<string, unknown>;


            return (

                typeof metadata.email === "string" &&

                metadata.email.toLowerCase() === normalizedEmail

            );

        }).length;

    }


    async hasExceededFailedLoginThreshold(

        tenantId: string,

        email: string,

        threshold =
            SecurityMonitoringConfig.failedLogin.maxAttempts,

    ): Promise<boolean> {


        const failures =

            await this.getFailedLoginCountByEmail(

                tenantId,

                email,

            );


        return failures >= threshold;

    }


    async getRecentAccountLockouts(

        tenantId: string,

    ) {

        return await this.securityEventRepository.findMany({

            tenantId,

            eventType:
                SecurityEventType.ACCOUNT_LOCKED,

            from:
                this.getWindowStart(60),

        });

    }


    async getAuthenticationFailures(

        tenantId: string,

    ) {

        return await this.securityEventRepository.findMany({

            tenantId,

            eventType:
                SecurityEventType.AUTHENTICATION_FAILURE,

            from:
                this.getWindowStart(60),

        });

    }


    async getSuspiciousAuthenticationActivity(

        tenantId: string,

    ) {


        const failures =

            await this.getAuthenticationFailures(

                tenantId,

            );


        const lockouts =

            await this.getRecentAccountLockouts(

                tenantId,

            );


        return {

            failedAttempts:
                failures.length,

            accountLockouts:
                lockouts.length,

            suspicious:

                failures.length >= 10 ||

                lockouts.length > 0,

            windowMinutes:
                60,

        };

    }

}

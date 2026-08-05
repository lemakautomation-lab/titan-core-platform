import { AuditAction } from "../../domain/security/audit-action";
import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";


export class SecurityAnalyticsService {


    private static readonly WINDOW_MINUTES = 15;


    constructor(
        private readonly auditLogRepository: AuditLogRepository,
    ) {}



    private getWindowStart(
        minutes = SecurityAnalyticsService.WINDOW_MINUTES,
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

            await this.auditLogRepository.findSecurityEvents(

                tenantId,

                AuditAction.AUTH_FAILURE,

                this.getWindowStart(),

            );



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

        threshold = 5,

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


        return await this.auditLogRepository.findSecurityEvents(

            tenantId,

            AuditAction.ACCOUNT_LOCKED,

            this.getWindowStart(60),

        );


    }



    async getAuthenticationFailures(

        tenantId: string,

    ) {


        return await this.auditLogRepository.findSecurityEvents(

            tenantId,

            AuditAction.AUTH_FAILURE,

            this.getWindowStart(60),

        );


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

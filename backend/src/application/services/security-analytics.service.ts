import { AuditAction } from "../../domain/security/audit-action";
import { AuditLogRepository } from "../../domain/repositories/audit-log.repository";

export class SecurityAnalyticsService {

    private static readonly WINDOW_MINUTES = 15;

    constructor(
        private readonly auditLogRepository: AuditLogRepository,
    ) {}

    async getFailedLoginCountByEmail(
        tenantId: string,
        email: string,
    ): Promise<number> {

        const from = new Date(
            Date.now() -
            SecurityAnalyticsService.WINDOW_MINUTES * 60 * 1000,
        );

        const events =
            await this.auditLogRepository.findSecurityEvents(
                tenantId,
                AuditAction.AUTH_FAILURE,
                from,
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

}

export interface LogoutCommand {

    sessionId: string;

    userId: string;

    tenantId: string;

    ipAddress?: string | null;

    userAgent?: string | null;

    requestId?: string | null;

}

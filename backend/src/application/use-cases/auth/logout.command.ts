export interface LogoutCommand {

    refreshToken: string;

    userId: string;

    tenantId: string;

    ipAddress?: string | null;

    userAgent?: string | null;

    requestId?: string | null;

}

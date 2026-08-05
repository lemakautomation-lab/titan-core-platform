export interface LoginCommand {

    tenantId: string;

    email: string;

    password: string;

    ipAddress?: string;

    userAgent?: string;

    requestId?: string;

}

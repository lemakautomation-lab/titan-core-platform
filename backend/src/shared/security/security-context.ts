export interface SecurityContext {
    userId: string;
    tenantId: string;
    organisationId?: string;
    sessionId?: string;

    roles: string[];

    permissions: string[];

    authenticationMethod?: string;

    requestId?: string;
}

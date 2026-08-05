export interface FailedLoginMetrics {
    byEmail: number;
    byIpAddress: number;
    byUser: number;
}

export interface SecurityAnalyticsRepository {
    getFailedLoginMetrics(
        tenantId: string,
        email: string,
        ipAddress: string | null,
        userId: string | null,
        since: Date,
    ): Promise<FailedLoginMetrics>;
}

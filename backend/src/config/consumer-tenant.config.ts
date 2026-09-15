const CONSUMER_TENANT_SLUG_PATTERN =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getConsumerTenantSlug(
    value:
        string | undefined =
            process.env
                .TITAN_HEALTH_CONSUMER_TENANT_SLUG,
    nodeEnvironment:
        string | undefined =
            process.env.NODE_ENV,
): string {
    const configuredValue =
        value ??
        (
            nodeEnvironment === "test"
                ? "titan-health-consumer-test"
                : undefined
        );

    const normalized =
        configuredValue?.trim().toLowerCase();

    if (
        !normalized ||
        !CONSUMER_TENANT_SLUG_PATTERN.test(
            normalized,
        )
    ) {
        throw new Error(
            "TITAN Health consumer tenant is not configured.",
        );
    }

    return normalized;
}
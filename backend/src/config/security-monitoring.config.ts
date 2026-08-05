export const SecurityMonitoringConfig = {
    failedLogin: {
        windowMinutes: Number(process.env.SECURITY_FAILED_LOGIN_WINDOW_MINUTES ?? 15),
        maxAttempts: Number(process.env.SECURITY_FAILED_LOGIN_MAX_ATTEMPTS ?? 5),
    },

    delay: {
        enabled: (process.env.SECURITY_PROGRESSIVE_DELAY_ENABLED ?? "true") === "true",
    },

    lockout: {
        durationMinutes: Number(process.env.SECURITY_LOCKOUT_DURATION_MINUTES ?? 30),
    },
} as const;

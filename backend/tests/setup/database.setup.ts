import dotenv from "dotenv";

const ALLOWED_TEST_DATABASE_HOSTS =
    new Set([
        "localhost",
        "127.0.0.1",
        "::1",
        "[::1]",
    ]);

const TEST_DATABASE_NAME =
    "titan_core_test";

export function assertSafeTestDatabaseConfiguration(
    databaseUrl:
        string | undefined,
    nodeEnvironment:
        string | undefined =
            process.env.NODE_ENV,
): string {

    if (nodeEnvironment !== "test") {
        throw new Error(
            "TEST DATABASE SAFETY ERROR: NODE_ENV must be test.",
        );
    }

    if (!databaseUrl) {
        throw new Error(
            "TEST DATABASE CONFIGURATION ERROR: DATABASE_URL is not defined.",
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl =
            new URL(databaseUrl);
    }
    catch {
        throw new Error(
            "TEST DATABASE SAFETY ERROR: DATABASE_URL is invalid.",
        );
    }

    if (
        parsedUrl.protocol !== "postgres:" &&
        parsedUrl.protocol !== "postgresql:"
    ) {
        throw new Error(
            "TEST DATABASE SAFETY ERROR: PostgreSQL is required.",
        );
    }

    if (!ALLOWED_TEST_DATABASE_HOSTS.has(parsedUrl.hostname)) {
        throw new Error(
            "TEST DATABASE SAFETY ERROR: database host must be local.",
        );
    }

    if (parsedUrl.pathname !== `/${TEST_DATABASE_NAME}`) {
        throw new Error(
            "TEST DATABASE SAFETY ERROR: database name must be exactly titan_core_test.",
        );
    }

    return databaseUrl;

}

export function setupTestDatabase(): void {

    dotenv.config({
        path:
            ".env.test",
        override:
            true,
    });

    assertSafeTestDatabaseConfiguration(
        process.env.DATABASE_URL,
    );

    console.log(
        "TEST DATABASE SAFETY VERIFIED: titan_core_test",
    );

}

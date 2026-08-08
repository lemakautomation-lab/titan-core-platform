import dotenv from "dotenv";

export async function setupTestDatabase() {

    dotenv.config({
        path: ".env.test",
        override: true,
    });

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error(
            "TEST DATABASE CONFIGURATION ERROR: DATABASE_URL is not defined."
        );
    }

    if (!databaseUrl.includes("/titan_core_test")) {
        throw new Error(
            "TEST DATABASE SAFETY ERROR: tests must use titan_core_test."
        );
    }

    console.log(
        "TEST DATABASE SETUP INITIALIZED: titan_core_test"
    );
}

import {
    readFileSync,
} from "node:fs";
import {
    resolve,
} from "node:path";

import {
    describe,
    expect,
    it,
} from "vitest";

import {
    assertSafeTestDatabaseConfiguration,
} from "./database.setup";

describe("Test Database Safety", () => {

    it.each([
        "postgresql://test:test@localhost:5432/titan_core_test",
        "postgres://test:test@127.0.0.1:5432/titan_core_test",
        "postgresql://test:test@[::1]:5432/titan_core_test",
    ])(
        "accepts an exact local test database URL",
        (databaseUrl) => {

            expect(
                assertSafeTestDatabaseConfiguration(
                    databaseUrl,
                    "test",
                ),
            ).toBe(databaseUrl);

        },
    );

    it.each([
        [
            undefined,
            "test",
        ],
        [
            "not-a-database-url",
            "test",
        ],
        [
            "https://localhost/titan_core_test",
            "test",
        ],
        [
            "postgresql://test:test@database.example.com:5432/titan_core_test",
            "test",
        ],
        [
            "postgresql://test:test@localhost:5432/titan_core",
            "test",
        ],
        [
            "postgresql://test:test@localhost:5432/titan_core_test_backup",
            "test",
        ],
        [
            "postgresql://test:test@localhost:5432/production?target=/titan_core_test",
            "test",
        ],
        [
            "postgresql://test:test@localhost:5432/titan_core_test",
            "development",
        ],
    ])(
        "rejects an unsafe database configuration",
        (
            databaseUrl,
            nodeEnvironment,
        ) => {

            expect(() =>
                assertSafeTestDatabaseConfiguration(
                    databaseUrl,
                    nodeEnvironment,
                ),
            ).toThrow(
                /TEST DATABASE (CONFIGURATION|SAFETY) ERROR/,
            );

        },
    );

});
describe("Development Database Environment Contract", () => {

    it("defines separate Prisma development and shadow databases", () => {

        const template =
            readFileSync(
                resolve(
                    process.cwd(),
                    ".env.example",
                ),
                "utf8",
            );

        expect(template)
            .toContain(
                "DATABASE_URL=postgresql://titan_app:CHANGE_ME_LOCAL_ONLY@localhost:5432/titan_core_development",
            );

        expect(template)
            .toContain(
                "SHADOW_DATABASE_URL=postgresql://titan_migrations:CHANGE_ME_LOCAL_ONLY@localhost:5432/titan_core_shadow",
            );

        expect(template)
            .toContain(
                "Never reuse development credentials in test, staging or production.",
            );

    });

    it("does not point development configuration at the test database", () => {

        const template =
            readFileSync(
                resolve(
                    process.cwd(),
                    ".env.example",
                ),
                "utf8",
            );

        const activeLines =
            template
                .split(/\r?\n/)
                .filter((line) =>
                    !line.trimStart().startsWith("#"),
                );

        expect(
            activeLines.some((line) =>
                line.includes("titan_core_test"),
            ),
        ).toBe(false);

    });

});
describe("Test Execution Isolation Contract", () => {

    it("disables file parallelism for the shared test database", () => {

        const configuration =
            readFileSync(
                resolve(
                    process.cwd(),
                    "vitest.config.ts",
                ),
                "utf8",
            )
                .replace(/\r\n/g, "\n");

        expect(configuration)
            .toMatch(
                /fileParallelism:\s*\n\s*false/,
            );

    });

});

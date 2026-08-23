import { defineConfig } from "vitest/config";


export default defineConfig({

    test: {

        globals:
            true,

        environment:
            "node",

        passWithNoTests:
            true,

        setupFiles: [
            "./tests/setup/env.setup.ts",
            "./tests/setup/test.setup.ts",
        ],

        include: [
            "tests/**/*.spec.ts",
        ],

        coverage: {

            provider:
                "v8",

            reporter: [
                "text",
                "html",
            ],

            reportsDirectory:
                "./coverage",

        },

    },

});

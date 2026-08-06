import "dotenv/config";

import {
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    vi
} from "vitest";

import {
    setupTestDatabase
} from "./database.setup";

import {
    cleanupTestDatabase
} from "./database.cleanup";


beforeAll(async () => {

    await setupTestDatabase();

});


afterAll(async () => {

    await cleanupTestDatabase();

});


beforeEach(() => {

    vi.clearAllMocks();

});


afterEach(() => {

    vi.restoreAllMocks();

});

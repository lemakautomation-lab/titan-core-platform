import {
    beforeEach,
    afterAll,
} from "vitest";

import {
    rateLimitModule,
} from "../../src/infrastructure/composition/rate-limit.module";


beforeEach(async () => {

    await rateLimitModule.resetRateLimiters();

});


afterAll(async () => {

    await rateLimitModule.resetRateLimiters();

});

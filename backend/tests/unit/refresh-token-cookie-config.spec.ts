import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("refresh token cookies", () => {
    it("marks staging refresh and clear cookies as Secure", async () => {
        vi.stubEnv("NODE_ENV", "staging");
        vi.resetModules();
        const config = await import("../../src/config/refresh-token-cookie.config");
        expect(config.refreshTokenCookieOptions.secure).toBe(true);
        expect(config.refreshTokenClearCookieOptions.secure).toBe(true);
    });

    it("keeps local development cookies usable on HTTP", async () => {
        vi.stubEnv("NODE_ENV", "development");
        vi.resetModules();
        const config = await import("../../src/config/refresh-token-cookie.config");
        expect(config.refreshTokenCookieOptions.secure).toBe(false);
    });
});

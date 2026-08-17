import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";


describe("JWT configuration security", () => {

    let originalSecret: string | undefined;


    beforeEach(() => {

        originalSecret =
            process.env.JWT_SECRET;

    });


    it("requires JWT_SECRET and does not fall back to a known secret", async () => {

        delete process.env.JWT_SECRET;

        vi.resetModules();

        await expect(
            import("../../../src/config/jwt.config"),
        ).rejects.toThrow(
            "JWT_SECRET environment variable is required",
        );

        process.env.JWT_SECRET =
            originalSecret;
    });


    it("loads the configured JWT secret", async () => {

        process.env.JWT_SECRET =
            "test-configured-secret";

        vi.resetModules();

        const {
            jwtConfig,
        } =
            await import(
                "../../../src/config/jwt.config"
            );

        expect(jwtConfig.secret)
            .toBe("test-configured-secret");

        expect(jwtConfig.secret)
            .not.toBe(
                "titan-development-secret",
            );

        process.env.JWT_SECRET =
            originalSecret;
    });

});

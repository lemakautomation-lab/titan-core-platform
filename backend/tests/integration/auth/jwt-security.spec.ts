import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import jwt from "jsonwebtoken";

import {
    jwtService,
} from "../../../src/security/jwt";

import {
    jwtConfig,
} from "../../../src/config/jwt.config";


describe("JWT security controls", () => {


    beforeEach(() => {

        expect(jwtConfig.secret)
            .toBeTruthy();

    });


    it("generates access tokens using HS256 with required claims", () => {

        const token =
            jwtService.generateAccessToken({

                userId:
                    "user-001",

                tenantId:
                    "tenant-001",

                roles:
                    ["admin"],

            });


        const decoded =
            jwt.decode(
                token,
                {
                    complete: true,
                },
            );


        expect(decoded)
            .toBeTruthy();

        expect(decoded)
            .toHaveProperty(
                "header.alg",
                "HS256",
            );

        expect(decoded)
            .toHaveProperty(
                "header.typ",
                "JWT",
            );

        expect(decoded)
            .toHaveProperty(
                "payload.userId",
                "user-001",
            );

        expect(decoded)
            .toHaveProperty(
                "payload.tenantId",
                "tenant-001",
            );

        expect(decoded)
            .toHaveProperty(
                "payload.roles",
                ["admin"],
            );

    });


    it("generates refresh tokens using HS256 with a unique jti", () => {

        const token =
            jwtService.generateRefreshToken({

                userId:
                    "user-001",

            });


        const decoded =
            jwt.decode(
                token.token,
                {
                    complete: true,
                },
            );


        expect(decoded)
            .toBeTruthy();

        expect(decoded)
            .toHaveProperty(
                "header.alg",
                "HS256",
            );

        expect(decoded)
            .toHaveProperty(
                "payload.userId",
                "user-001",
            );

        expect(decoded)
            .toHaveProperty(
                "payload.jti",
            );

        const secondToken =
            jwtService.generateRefreshToken({

                userId:
                    "user-001",

            });


        const secondDecoded =
            jwt.decode(
                secondToken.token,
                {
                    complete: true,
                },
            );


        expect(secondDecoded)
            .toHaveProperty(
                "payload.jti",
            );


        expect(
            (decoded as jwt.Jwt).payload.jti,
        ).not.toBe(
            (secondDecoded as jwt.Jwt).payload.jti,
        );

    });


    it("verifies a valid access token", () => {

        const token =
            jwtService.generateAccessToken({

                userId:
                    "user-001",

                tenantId:
                    "tenant-001",

                roles:
                    ["admin"],

            });


        const payload =
            jwtService.verifyAccessToken(
                token,
            );


        expect(payload.userId)
            .toBe("user-001");

        expect(payload.tenantId)
            .toBe("tenant-001");

        expect(payload.roles)
            .toEqual(["admin"]);

    });


    it("verifies a valid refresh token", () => {

        const token =
            jwtService.generateRefreshToken({

                userId:
                    "user-001",

            });


        const payload =
            jwtService.verifyRefreshToken(
                token.token,
            );


        expect(payload.userId)
            .toBe("user-001");

        expect(payload.jti)
            .toBeTruthy();

    });


    it("rejects an access token signed with an unapproved algorithm", () => {

        const token =
            jwt.sign(
                {
                    userId:
                        "user-001",

                    tenantId:
                        "tenant-001",

                    roles:
                        ["admin"],
                },

                jwtConfig.secret,

                {
                    algorithm:
                        "HS384",

                    issuer:
                        jwtConfig.issuer,

                    audience:
                        jwtConfig.audience,

                    expiresIn:
                        "15m",
                },
            );


        expect(() =>
            jwtService.verifyAccessToken(
                token,
            ),
        ).toThrow();

    });


    it("rejects a refresh token signed with an unapproved algorithm", () => {

        const token =
            jwt.sign(
                {
                    userId:
                        "user-001",

                    jti:
                        "malicious-jti",
                },

                jwtConfig.secret,

                {
                    algorithm:
                        "HS384",

                    issuer:
                        jwtConfig.issuer,

                    audience:
                        jwtConfig.audience,

                    expiresIn:
                        "7d",
                },
            );


        expect(() =>
            jwtService.verifyRefreshToken(
                token,
            ),
        ).toThrow();

    });


    it("rejects an access token with the wrong issuer", () => {

        const token =
            jwt.sign(
                {
                    userId:
                        "user-001",

                    tenantId:
                        "tenant-001",

                    roles:
                        [],
                },

                jwtConfig.secret,

                {
                    algorithm:
                        "HS256",

                    issuer:
                        "attacker",

                    audience:
                        jwtConfig.audience,

                    expiresIn:
                        "15m",
                },
            );


        expect(() =>
            jwtService.verifyAccessToken(
                token,
            ),
        ).toThrow();

    });


    it("rejects an access token with the wrong audience", () => {

        const token =
            jwt.sign(
                {
                    userId:
                        "user-001",

                    tenantId:
                        "tenant-001",

                    roles:
                        [],
                },

                jwtConfig.secret,

                {
                    algorithm:
                        "HS256",

                    issuer:
                        jwtConfig.issuer,

                    audience:
                        "attacker",

                    expiresIn:
                        "15m",
                },
            );


        expect(() =>
            jwtService.verifyAccessToken(
                token,
            ),
        ).toThrow();

    });


});







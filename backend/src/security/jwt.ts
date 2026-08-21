import crypto from "crypto";
import jwt, {
    JwtPayload,
} from "jsonwebtoken";

import { jwtConfig } from "../config/jwt.config";


export interface AccessTokenPayload extends JwtPayload {

    userId: string;

    tenantId: string;

    roles: string[];

}


export interface RefreshTokenPayload extends JwtPayload {

    userId: string;

    jti: string;

}


export interface GeneratedRefreshToken {

    token: string;

    jti: string;

}


export class JwtService {


    generateAccessToken(
        payload: object,
    ): string {

        return jwt.sign(
            payload,
            jwtConfig.secret,
            {
                algorithm: "HS256",
                expiresIn: "15m",
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience,
            },
        );

    }


    generateRefreshToken(
        payload: object,
    ): GeneratedRefreshToken {

        const jti =
            crypto.randomUUID();

        const token =
            jwt.sign(
                {
                    ...payload,
                    jti,
                },
                jwtConfig.secret,
                {
                    algorithm: "HS256",
                    expiresIn: "7d",
                    issuer: jwtConfig.issuer,
                    audience: jwtConfig.audience,
                },
            );

        return {

            token,

            jti,

        };

    }


    verifyAccessToken(
        token: string,
    ): AccessTokenPayload {

        const payload =
            jwt.verify(
                token,
                jwtConfig.secret,
                {
                    algorithms: ["HS256"],
                    issuer: jwtConfig.issuer,
                    audience: jwtConfig.audience,
                },
            );

        if (
            typeof payload === "string" ||
            !payload.userId ||
            !payload.tenantId ||
            !Array.isArray(payload.roles)
        ) {

            throw new Error(
                "Invalid access token payload",
            );

        }

        return payload as AccessTokenPayload;

    }


    verifyRefreshToken(
        token: string,
    ): RefreshTokenPayload {

        const payload =
            jwt.verify(
                token,
                jwtConfig.secret,
                {
                    algorithms: ["HS256"],
                    issuer: jwtConfig.issuer,
                    audience: jwtConfig.audience,
                },
            );

        if (
            typeof payload === "string" ||
            !payload.userId ||
            !payload.jti
        ) {

            throw new Error(
                "Invalid refresh token payload",
            );

        }

        return payload as RefreshTokenPayload;

    }

}


export const jwtService = new JwtService();

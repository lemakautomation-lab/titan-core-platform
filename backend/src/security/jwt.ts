import crypto from "crypto";
import jwt from "jsonwebtoken";

import { jwtConfig } from "../config/jwt.config";


export class JwtService {


    generateAccessToken(
        payload: object,
    ): string {

        return jwt.sign(
            payload,
            jwtConfig.secret,
            {
                expiresIn: "15m",
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience,
            },
        );

    }


    generateRefreshToken(
        payload: object,
    ): string {

        return jwt.sign(
            {
                ...payload,
                jti: crypto.randomUUID(),
            },
            jwtConfig.secret,
            {
                expiresIn: "7d",
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience,
            },
        );

    }


    verifyAccessToken(
        token: string,
    ): any {

        return jwt.verify(
            token,
            jwtConfig.secret,
            {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience,
            },
        );

    }


    verifyRefreshToken(
        token: string,
    ): any {

        return jwt.verify(
            token,
            jwtConfig.secret,
            {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience,
            },
        );

    }

}


export const jwtService = new JwtService();

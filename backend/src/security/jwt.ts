import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.config";

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export class JwtSecurity {

    generateAccessToken(payload: JwtPayload): string {

        return jwt.sign(
            payload,
            jwtConfig.secret,
            {
                expiresIn: jwtConfig.expiresIn,
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            }
        );

    }

    verifyToken(token: string): JwtPayload {

        return jwt.verify(
            token,
            jwtConfig.secret,
            {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            }
        ) as JwtPayload;

    }

}

export const jwtSecurity = new JwtSecurity();
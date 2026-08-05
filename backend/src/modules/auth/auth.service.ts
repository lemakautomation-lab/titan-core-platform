import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { jwtConfig } from "../../config/jwt.config";
import { logger } from "../../logging/logger";


export class AuthService {


    constructor() {

        logger.info(
            "Authentication service initialized",
            {
                event: "AUTH_SERVICE_INITIALIZED",
            },
        );

    }


    async login(email: string, password: string) {


        logger.info(
            "Login attempt received",
            {
                event: "LOGIN_ATTEMPT",
                identifierProvided: !!email,
            },
        );


        const user = {

            id: "001",

            email: "admin@titan.com",

            passwordHash: await bcrypt.hash(
                "admin123",
                10,
            ),

            role: "admin",

        };


        const passwordValid =
            await bcrypt.compare(
                password,
                user.passwordHash,
            );


        if (!passwordValid) {


            logger.warn(
                "Login failed",
                {
                    event: "LOGIN_FAILURE",
                    reason: "INVALID_CREDENTIALS",
                },
            );


            return {

                authenticated: false,

                message: "Invalid credentials",

            };

        }


        const token =
            jwt.sign(

                {
                    id: user.id,

                    email: user.email,

                    role: user.role,

                },

                jwtConfig.secret,

                {
                    expiresIn: "24h",
                },

            );


        logger.info(
            "Login successful",
            {
                event: "LOGIN_SUCCESS",
            },
        );


        return {

            authenticated: true,

            user: {

                id: user.id,

                email: user.email,

                role: user.role,

            },

            token,

        };

    }

}

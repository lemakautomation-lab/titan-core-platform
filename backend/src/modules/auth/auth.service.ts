import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/jwt.config";


export class AuthService {

    constructor() {
        console.log("🔥 NEW TITAN AUTH SERVICE LOADED");
    }

    async login(email: string, password: string) {
        console.log("🔥 NEW LOGIN FUNCTION RUNNING", email);

        const user = {
            id: "001",
            email: "admin@titan.com",
            passwordHash: await bcrypt.hash(
                "admin123",
                10
            ),
            role: "admin"
        };


        const passwordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );


        if (!passwordValid) {

            return {
                authenticated: false,
                message: "Invalid credentials"
            };

        }


        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            jwtConfig.secret,
            {
                expiresIn: "24h"
            }
        );


        return {
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            token
        };

    }

}
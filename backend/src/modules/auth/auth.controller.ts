import { Request, Response } from "express";
import { AuthService } from "./auth.service";


const authService = new AuthService();


export class AuthController {

    async login(req: Request, res: Response) {
        console.log("🔥 AUTH CONTROLLER LOGIN HIT");

        const { email, password } = req.body;


        const result = await authService.login(
            email,
            password
        );


        res.json({
            success: true,
            data: result
        });

    }

}
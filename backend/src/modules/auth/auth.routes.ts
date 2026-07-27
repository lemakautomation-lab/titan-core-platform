import { Router } from "express";

import { AuthController } from "./auth.controller";


export function createAuthRoutes(
    authController: AuthController,
) {

    const router = Router();


    router.post(
        "/login",
        authController.login.bind(authController),
    );


    router.post(
        "/refresh",
        authController.refresh.bind(authController),
    );


    router.post(
        "/logout",
        authController.logout.bind(authController),
    );


    return router;

}

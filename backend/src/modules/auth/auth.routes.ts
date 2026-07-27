import { Router } from "express";

import { AuthController } from "./auth.controller";

import { authMiddleware } from "../../middleware/auth.middleware";


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


    router.get(
        "/me",
        authMiddleware,
        authController.me.bind(authController),
    );


    return router;

}

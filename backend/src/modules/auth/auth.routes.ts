import { Router } from "express";

import { AuthController } from "./auth.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rate-limit.middleware";

export function createAuthRoutes(
    authController: AuthController,
) {

    const router = Router();

    router.post(
        "/login",
        authRateLimiter,
        authController.login.bind(authController),
    );

    router.post(
        "/refresh",
        authRateLimiter,
        authController.refresh.bind(authController),
    );

    router.post(
        "/logout",
        authRateLimiter,
        authController.logout.bind(authController),
    );

    router.get(
        "/me",
        authMiddleware,
        authController.me.bind(authController),
    );

    return router;

}

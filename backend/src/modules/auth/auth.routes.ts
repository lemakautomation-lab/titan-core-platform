import { Router } from "express";

import { AuthController } from "./auth.controller";
import {
    accountAssistanceController,
} from "./account-assistance.controller";
import {
    passwordResetController,
} from "./password-reset.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import {
    authRateLimiter,
} from "../../infrastructure/composition/rate-limit.module";


export interface AuthRateLimitOptions {

    windowMs?:
        number;

    limit?:
        number;

}


export function createAuthRoutes(
    authController: AuthController,
) {

    const router = Router();

    router.post(
        "/register/athlete",
        authRateLimiter,
        authController
            .registerAthlete
            .bind(authController),
    );

    router.post(
        "/account-assistance/request",
        authRateLimiter,
        accountAssistanceController
            .request
            .bind(accountAssistanceController),
    );
    router.post(
        "/password-reset/request",
        authRateLimiter,
        passwordResetController
            .request
            .bind(passwordResetController),
    );

    router.post(
        "/password-reset/complete",
        authRateLimiter,
        passwordResetController
            .complete
            .bind(passwordResetController),
    );
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
        authMiddleware,
        authController.logout.bind(authController),
    );

    router.get(
        "/me",
        authMiddleware,
        authController.me.bind(authController),
    );

    router.put(
        "/me",
        authMiddleware,
        authController.updateMe.bind(authController),
    );
    router.put(
        "/me/goals",
        authMiddleware,
        authController.updateMyGoals.bind(authController),
    );


    router.post(
        "/me/body-measurements",
        authMiddleware,
        authController
            .createMyBodyMeasurement
            .bind(authController),
    );

    router.get(
        "/me/onboarding-status",
        authMiddleware,
        authController
            .getMyOnboardingStatus
            .bind(authController),
    );

    router.put(
        "/me/body-model",
        authMiddleware,
        authController
            .updateMyBodyModel
            .bind(authController),
    );

    router.get(
        "/me/performance-body",
        authMiddleware,
        authController
            .getMyPerformanceBodyProfile
            .bind(authController),
    );
    router.get(
        "/me/relevant-context",
        authMiddleware,
        authController
            .getMyRelevantContext
            .bind(authController),
    );

     return router;

}

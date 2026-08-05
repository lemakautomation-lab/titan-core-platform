import { Router } from "express";

import { SecurityController } from "../controllers/security.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";


export function createSecurityRoutes(
    controller: SecurityController,
): Router {


    const router = Router();



    router.use(
        authMiddleware,
    );



    router.get(
        "/analytics",
        requirePermission(
            "security.analytics.read",
        ),
        controller.analytics.bind(controller),
    );



    return router;

}

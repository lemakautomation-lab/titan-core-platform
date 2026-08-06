import { Router } from "express";

import { TenantController } from "../controllers/tenant.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createTenantRoutes(
    controller: TenantController,
): Router {

    const router = Router();

    router.use(
        authMiddleware,
    );

    router.post(
        "/",
        requirePermission("tenants.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("tenants.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("tenants.read"),
        controller.getById.bind(controller),
    );

    router.put(
        "/:id",
        requirePermission("tenants.update"),
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("tenants.delete"),
        controller.delete.bind(controller),
    );

    return router;
}

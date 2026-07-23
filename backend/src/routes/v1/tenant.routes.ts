import { Router } from "express";

import { TenantController } from "../../presentation/controllers/tenant.controller";

export function createTenantRoutes(
    controller: TenantController,
): Router {

    const router = Router();

    router.post(
        "/",
        controller.create.bind(controller),
    );

    router.get(
        "/",
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        controller.getById.bind(controller),
    );

    router.put(
        "/:id",
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        controller.delete.bind(controller),
    );

    return router;

}

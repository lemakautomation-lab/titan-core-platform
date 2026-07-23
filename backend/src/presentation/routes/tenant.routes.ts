import { Router } from "express";

import { TenantController } from "../controllers/tenant.controller";


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


    return router;

}
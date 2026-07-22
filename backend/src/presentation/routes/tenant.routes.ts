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

    return router;

}
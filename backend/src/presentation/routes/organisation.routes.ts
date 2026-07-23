import { Router } from "express";

import { OrganisationController } from "../controllers/organisation.controller";

export function createOrganisationRoutes(
    controller: OrganisationController,
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
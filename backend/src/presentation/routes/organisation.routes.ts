import { Router } from "express";

import { OrganisationController } from "../controllers/organisation.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createOrganisationRoutes(
    controller: OrganisationController,
): Router {

    const router = Router();

    router.use(
        authMiddleware,
    );

    router.post(
        "/",
        requirePermission("organisations.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("organisations.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("organisations.read"),
        controller.getById.bind(controller),
    );

    router.put(
        "/:id",
        requirePermission("organisations.update"),
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("organisations.delete"),
        controller.delete.bind(controller),
    );

    return router;
}

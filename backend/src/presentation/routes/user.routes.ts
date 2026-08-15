import { Router } from "express";

import { UserController } from "../controllers/user.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";


export function createUserRoutes(
    controller: UserController,
): Router {

    const router = Router();


    router.use(
        authMiddleware,
    );


    router.get(
        "/",
        requirePermission("users.read"),
        controller.list.bind(controller),
    );


    router.post(
        "/",
        requirePermission("users.create"),
        controller.create.bind(controller),
    );


    router.post(
        "/:userId/roles/:roleId",
        requirePermission("users.update"),
        controller.assignRole.bind(controller),
    );


    router.get(
        "/:userId/roles",
        requirePermission("users.read"),
        controller.getRoles.bind(controller),
    );


    router.delete(
        "/:userId/roles/:roleId",
        requirePermission("users.update"),
        controller.removeRole.bind(controller),
    );


    router.post(
        "/:id/unlock",
        requirePermission("users.update"),
        controller.unlock.bind(controller),
    );


    router.get(
        "/:id",
        requirePermission("users.read"),
        controller.getById.bind(controller),
    );


    router.put(
        "/:id",
        requirePermission("users.update"),
        controller.update.bind(controller),
    );


    router.delete(
        "/:id",
        requirePermission("users.delete"),
        controller.delete.bind(controller),
    );


    return router;

}

import { Router } from "express";

import { PermissionController } from "../controllers/permission.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";


export function createPermissionRoutes(

    controller: PermissionController,

): Router {


    const router = Router();


    router.use(
        authMiddleware,
    );



    router.post(

        "/",

        requirePermission("permissions.create"),

        controller.create.bind(controller),

    );



    router.get(

        "/",

        requirePermission("permissions.read"),

        controller.list.bind(controller),

    );



    router.get(

        "/:id",

        requirePermission("permissions.read"),

        controller.getById.bind(controller),

    );



    router.put(

        "/:id",

        requirePermission("permissions.update"),

        controller.update.bind(controller),

    );



    router.delete(

        "/:id",

        requirePermission("permissions.delete"),

        controller.delete.bind(controller),

    );



    return router;

}

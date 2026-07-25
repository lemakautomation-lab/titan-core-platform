import { Router } from "express";

import { RoleController } from "../controllers/role.controller";

export function createRoleRoutes(

    controller: RoleController,

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

    return router;

}

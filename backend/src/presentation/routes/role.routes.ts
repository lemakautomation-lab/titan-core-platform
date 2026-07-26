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


    router.put(

        "/:id",

        controller.update.bind(controller),

    );


    router.delete(

        "/:id",

        controller.delete.bind(controller),

    );


    router.post(

        "/:roleId/permissions/:permissionId",

        controller.assignPermission.bind(controller),

    );


    router.get(

        "/:id/permissions",

        controller.getPermissions.bind(controller),

    );


    return router;

}

import { Router } from "express";

import { RoleController } from "../controllers/role.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";


export function createRoleRoutes(

    controller: RoleController,

): Router {

    console.log('=== ROLE ROUTES LOADED ===');


    const router = Router();


    router.use(
        authMiddleware,
    );



    router.post(
        "/",
        requirePermission("roles.create"),
        controller.create.bind(controller),
    );



    router.get(
        "/",
        requirePermission("roles.read"),
        controller.list.bind(controller),
    );



    router.get(
        "/:id",
        requirePermission("roles.read"),
        controller.getById.bind(controller),
    );



    router.put(
        "/:id",
        requirePermission("roles.update"),
        controller.update.bind(controller),
    );



    router.delete(
        "/:id",
        requirePermission("roles.delete"),
        controller.delete.bind(controller),
    );



    router.post(
        "/:roleId/permissions/:permissionId",
        requirePermission("roles.update"),
        controller.assignPermission.bind(controller),
    );



    router.get(
        "/:id/permissions",
        requirePermission("roles.read"),
        controller.getPermissions.bind(controller),
    );



    router.delete(
        "/:roleId/permissions/:permissionId",
        requirePermission("roles.update"),
        controller.deletePermission.bind(controller),
    );

    console.log('=== DELETE PERMISSION ROUTE REGISTERED ===');



    return router;

}



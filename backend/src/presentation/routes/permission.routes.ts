import { Router } from "express";

import { PermissionController } from "../controllers/permission.controller";

export function createPermissionRoutes(

    controller: PermissionController,

): Router {

    const router = Router();


    router.post(

        "/",

        controller.create.bind(controller),

    );


    return router;

}

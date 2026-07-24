import { Router } from "express";

import { UserController } from "../controllers/user.controller";


export function createUserRoutes(
    controller: UserController,
): Router {

    const router = Router();


    router.get(
        "/",
        controller.list.bind(controller),
    );


    router.post(
        "/",
        controller.create.bind(controller),
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

import { Router } from "express";

import { UserController } from "../controllers/user.controller";


export function createUserRoutes(
    controller: UserController,
): Router {

    const router = Router();


    router.post(
        "/",
        controller.create.bind(controller),
    );


    router.get(
        "/:id",
        controller.getById.bind(controller),
    );


    return router;

}

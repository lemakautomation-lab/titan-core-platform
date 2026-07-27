import { Router } from "express";

import { SessionController } from "../controllers/session.controller";

export function createSessionRoutes(

    controller: SessionController,

): Router {

    const router = Router();

    router.get(

        "/:id",

        controller.getById.bind(controller),

    );

    return router;

}

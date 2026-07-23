import { Router } from "express";

import { OrganisationController } from "../controllers/organisation.controller";


export function createOrganisationRoutes(
    controller: OrganisationController,
): Router {


    const router = Router();


    router.post(
        "/",
        controller.create.bind(controller),
    );


    return router;

}

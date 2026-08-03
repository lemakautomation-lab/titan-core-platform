import { Router } from "express";

import { AuditLogController } from "../controllers/audit-log.controller";

import { authMiddleware } from "../../middleware/auth.middleware";

import { requireAuditAccess }
    from "../../middleware/audit-authorization.middleware";



export function createAuditLogRoutes(

    controller: AuditLogController,

): Router {


    const router = Router();



    router.use(

        authMiddleware,

    );



    router.get(

        "/",

        requireAuditAccess(),

        controller.list.bind(controller),

    );



    router.get(

        "/:id",

        requireAuditAccess(),

        controller.getById.bind(controller),

    );



    return router;


}

import { Router } from "express";

import { AuditLogController } from "../controllers/audit-log.controller";

import { authMiddleware } from "../../middleware/auth.middleware";

import { requirePermission } from "../../middleware/authorization.middleware";



export function createAuditLogRoutes(

    controller: AuditLogController,

): Router {


    const router = Router();



    router.use(

        authMiddleware,

    );



    router.get(

        "/",

        requirePermission("audit.read"),

        controller.list.bind(controller),

    );



    return router;


}

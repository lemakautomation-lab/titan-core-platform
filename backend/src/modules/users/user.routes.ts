import { Router } from "express";

import { userController } from "./user.controller";

import { requirePermission } from "../../middleware/authorization.middleware";

const router = Router();


router.get(
    "/:id",
    requirePermission("users.read"),
    (req, res) =>
        userController.getUserById(req, res)
);


router.get(
    "/email/:email",
    requirePermission("users.read"),
    (req, res) =>
        userController.getUserByEmail(req, res)
);


export { router as userRoutes };

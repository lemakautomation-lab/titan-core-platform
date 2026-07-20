import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { UserRole } from "../../../types/roles";

const router = Router();

const controller = new UsersController();

router.get(
    "/users",
    authMiddleware,
    authorize(UserRole.ADMIN),
    controller.getUsers
);

export default router;
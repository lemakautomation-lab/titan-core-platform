import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { UserRole } from "../types/roles";

const router = Router();

router.get(
    "/admin",
    authMiddleware,
    authorize(UserRole.ADMIN),
    (req, res) => {
        res.json({
            message: "Welcome TITAN Administrator",
            access: "granted"
        });
    }
);

export default router;
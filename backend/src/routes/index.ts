import { Router } from "express";
import usersRoutes from "../modules/users/routes/users.routes";
import protectedRoutes from "./protected.routes";
import adminRoutes from "./admin.routes";
import apiRoutes from "./api";

const router = Router();

router.use("/api", apiRoutes);

router.use("/api/v1", protectedRoutes);
router.use("/api/v1", adminRoutes);
router.use("/api/v1", usersRoutes);

export default router;
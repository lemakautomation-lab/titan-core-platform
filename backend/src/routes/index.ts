import { Router } from "express";
import protectedRoutes from "./protected.routes";
import adminRoutes from "./admin.routes";
import apiRoutes from "./api";

const router = Router();

router.use("/api", apiRoutes);

router.use("/api/v1", protectedRoutes);
router.use("/api/v1", adminRoutes);

export default router;
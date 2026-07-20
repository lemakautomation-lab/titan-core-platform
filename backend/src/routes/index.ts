import { Router } from "express";
import protectedRoutes from "./protected.routes";
import apiRoutes from "./api";

const router = Router();

router.use("/api", apiRoutes);

router.use("/api/v1", protectedRoutes);

export default router;
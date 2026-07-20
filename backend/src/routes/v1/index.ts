import { Router } from "express";
import { healthRoutes } from "../../modules/health";
import { authRoutes } from "../../modules/auth";
import { userRoutes } from "../../modules/users";

const router = Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "V1 Router Working",
  });
});
router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
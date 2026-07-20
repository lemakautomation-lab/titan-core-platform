import { Router } from "express";
import { userController } from "./user.controller";

const router = Router();

router.get("/:id", (req, res) => userController.getUserById(req, res));

router.get("/email/:email", (req, res) =>
  userController.getUserByEmail(req, res)
);

export { router as userRoutes };
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
    res.json({
        application: "TITAN Core Platform",
        status: "online"
    });
});

export default router;
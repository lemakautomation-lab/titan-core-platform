import { Request, Response } from "express";
import { healthService } from "../services/health.service";

export const getHealth = (_req: Request, res: Response): void => {
    const health = healthService.getHealth();

    res.json({
        success: true,
        data: health
    });
};
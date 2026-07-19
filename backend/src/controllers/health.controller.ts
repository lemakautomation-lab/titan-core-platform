import { Request, Response } from "express";

export const getHealth = (_req: Request, res: Response): void => {
    res.json({
        application: "TITAN Core Platform",
        status: "online",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development"
    });
};
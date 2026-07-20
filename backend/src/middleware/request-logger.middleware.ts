import { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

export const requestLogger = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    logger.info(`${req.method} ${req.originalUrl}`);

    next();
};
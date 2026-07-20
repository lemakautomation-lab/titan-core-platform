import { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error(error.message);

    res.status(500).json({
        success: false,
        error: {
            message: error.message,
            statusCode: 500
        }
    });
};
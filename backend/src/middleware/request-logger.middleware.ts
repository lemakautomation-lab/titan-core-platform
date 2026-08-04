import { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

export const requestLogger = (
    req: Request & { requestId?: string },
    res: Response,
    next: NextFunction,
): void => {

    const start = Date.now();

    res.on("finish", () => {

        logger.info(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                requestId: req.requestId ?? null,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - start,
                ip: req.ip,
                userAgent: req.get("user-agent") ?? null,
            }),
        );

    });

    next();

};

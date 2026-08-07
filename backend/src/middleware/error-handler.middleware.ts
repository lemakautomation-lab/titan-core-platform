import { Request, Response, NextFunction } from "express";

import { HttpException } from "../shared/exceptions/http.exception";
import { ValidationException } from "../shared/exceptions/validation.exception";
import { logger } from "../logging/logger";

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) {

    logger.error(
        "Unhandled application error",
        {
            path: req.originalUrl,
            method: req.method,
            error:
                error instanceof Error
                    ? error.message
                    : String(error),
        },
    );

    if (error instanceof ValidationException) {

        return res.status(error.statusCode).json({

            success: false,

            error: {
                code: error.code ?? "VALIDATION_ERROR",
                message: error.message,
                details: error.errors,
            },

            timestamp: new Date().toISOString(),

            path: req.originalUrl,

        });

    }

    if (error instanceof HttpException) {

        return res.status(error.statusCode).json({

            success: false,

            error: {
                code: error.code ?? "HTTP_ERROR",
                message: error.message,
            },

            timestamp: new Date().toISOString(),

            path: req.originalUrl,

        });

    }

    if (error instanceof Error) {

        logger.error(
            "Unhandled exception stack",
            {
                stack: error.stack,
            },
        );

    }

    return res.status(500).json({

        success: false,

        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred.",
        },

        timestamp: new Date().toISOString(),

        path: req.originalUrl,

    });

}

import { Request, Response, NextFunction } from "express";

import { logger } from "../logging/logger";


export function requestMetricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {

    const start =
        process.hrtime.bigint();


    res.on(
        "finish",
        () => {

            const end =
                process.hrtime.bigint();


            const durationMs =
                Number(
                    end - start,
                ) / 1_000_000;


            logger.info(
                "HTTP request completed",
                {
                    event:
                        "HTTP_REQUEST_COMPLETED",

                    method:
                        req.method,

                    path:
                        req.originalUrl,

                    statusCode:
                        res.statusCode,

                    durationMs:
                        Math.round(durationMs),

                },
            );

        },
    );


    next();

}

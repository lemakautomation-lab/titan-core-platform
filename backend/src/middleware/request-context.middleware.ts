import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

import { requestContextService } from "../shared/context/request-context.service";


export function requestContextMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {

    const requestId = randomUUID();


    res.setHeader(
        "X-Request-ID",
        requestId,
    );


    requestContextService.run(
        {
            requestId,
        },
        () => {
            next();
        },
    );

}

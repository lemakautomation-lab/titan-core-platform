import { Request, Response, NextFunction } from "express";

import {
    RequestWithId,
} from "./request-id.middleware";

import {
    requestContextService,
} from "../shared/context/request-context.service";


export function requestContextMiddleware(
    req: RequestWithId,
    res: Response,
    next: NextFunction,
): void {

    const requestId =
        req.requestId;


    if (!requestId) {

        /*
         * requestIdMiddleware is responsible for establishing
         * the canonical request ID. Fail closed if middleware
         * ordering/configuration violates that contract.
         */

        throw new Error(
            "Request ID was not established before request context middleware",
        );

    }


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

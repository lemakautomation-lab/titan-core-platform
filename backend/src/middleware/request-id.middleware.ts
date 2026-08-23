import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";


export interface RequestWithId extends Request {
    requestId?: string;
}


export function requestIdMiddleware(
    req: RequestWithId,
    res: Response,
    next: NextFunction,
): void {

    const suppliedRequestId =
        req.get("X-Request-Id")?.trim();


    const requestId =
        suppliedRequestId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            suppliedRequestId,
        )
            ? suppliedRequestId
            : randomUUID();


    req.requestId =
        requestId;


    res.setHeader(
        "X-Request-ID",
        requestId,
    );


    next();

}

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


    const requestId =

        randomUUID();



    req.requestId = requestId;



    res.setHeader(

        "X-Request-ID",

        requestId,

    );



    next();


}

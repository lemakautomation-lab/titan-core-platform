import { Request, Response, NextFunction } from "express";

import { logger } from "../logging/logger";


export const requestLogger = (

    req: Request & { requestId?: string },

    res: Response,

    next: NextFunction,

): void => {


    const start = Date.now();



    res.on(

        "finish",

        () => {


            const duration =

                Date.now() - start;



            logger.info(

                JSON.stringify({

                    requestId:
                        req.requestId ?? null,

                    method:
                        req.method,

                    url:
                        req.originalUrl,

                    statusCode:
                        res.statusCode,

                    durationMs:
                        duration,

                }),

            );


        },

    );



    next();


};

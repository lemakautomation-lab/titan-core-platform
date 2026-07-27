import { Request, Response } from "express";

import { GetSessionByIdQuery } from "../../application/queries/session/get-session-by-id.query";

import { GetSessionByIdUseCase } from "../../application/use-cases/get-session-by-id.use-case";

export class SessionController {

    constructor(

        private readonly getSessionByIdUseCase: GetSessionByIdUseCase,

    ) {}

    async getById(

        req: Request,

        res: Response,

    ): Promise<void> {

        const query =

            new GetSessionByIdQuery(

                String(req.params.id),

            );

        const result =

            await this.getSessionByIdUseCase.execute(

                query,

            );

        if (!result.isSuccess) {

            res.status(404).json({

                error: result.error,

            });

            return;

        }

        res.status(200).json(

            result.value,

        );

    }

}

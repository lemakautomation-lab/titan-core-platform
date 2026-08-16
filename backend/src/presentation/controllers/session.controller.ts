import { Response } from "express";

import { GetSessionByIdQuery } from "../../application/queries/session/get-session-by-id.query";

import { GetSessionByIdUseCase } from "../../application/use-cases/get-session-by-id.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";


export class SessionController {

    constructor(

        private readonly getSessionByIdUseCase: GetSessionByIdUseCase,

    ) {}

    async getById(

        req: AuthRequest,

        res: Response,

    ): Promise<void> {

        const authUser = req.user;

        if (!authUser) {

            res.status(401).json({
                error: "Unauthorized",
            });

            return;
        }

        const query =

            new GetSessionByIdQuery(

                String(req.params.id),

                authUser.tenantId,

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

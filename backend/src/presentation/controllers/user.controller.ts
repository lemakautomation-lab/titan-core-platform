import { Request, Response } from "express";

import { CreateUserCommand } from "../../application/commands/create-user.command";
import { GetUserByIdQuery } from "../../application/queries/user/get-user-by-id.query";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";


export class UserController {

    constructor(

        private readonly createUserUseCase: CreateUserUseCase,

        private readonly getUserByIdUseCase: GetUserByIdUseCase,

    ) {}


    async create(
        req: Request,
        res: Response,
    ): Promise<void> {


        const command =
            new CreateUserCommand(

                req.body.tenantId,

                req.body.organisationId ?? null,

                req.body.email,

                req.body.password,

                req.body.firstName ?? null,

                req.body.lastName ?? null,

            );


        const result =
            await this.createUserUseCase.execute(
                command,
            );


        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;

        }


        res.status(201).json(result.value);

    }



    async getById(
        req: Request,
        res: Response,
    ): Promise<void> {


        const query =
            new GetUserByIdQuery(
                String(req.params.id),
            );


        const result =
            await this.getUserByIdUseCase.execute(
                query,
            );


        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;

        }


        res.status(200).json(result.value);

    }

}

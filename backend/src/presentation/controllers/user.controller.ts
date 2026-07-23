import { Request, Response } from "express";

import { CreateUserCommand } from "../../application/commands/create-user.command";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";

export class UserController {

    constructor(

        private readonly createUserUseCase: CreateUserUseCase,

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

}

import { Request, Response } from "express";

import { CreatePermissionCommand } from "../../application/commands/create-permission.command";

import { CreatePermissionUseCase } from "../../application/use-cases/create-permission.use-case";

export class PermissionController {

    constructor(

        private readonly createPermissionUseCase: CreatePermissionUseCase,

    ) {}

    async create(

        req: Request,

        res: Response,

    ): Promise<void> {

        const command =
            new CreatePermissionCommand(

                String(req.body.name),

                req.body.description ?? null,

            );

        const result =
            await this.createPermissionUseCase.execute(
                command,
            );

        if (!result.isSuccess) {

            res.status(400).json({

                error: result.error,

            });

            return;

        }

        res.status(201).json(
            result.value,
        );

    }

}

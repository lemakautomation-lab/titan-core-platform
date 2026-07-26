import { Request, Response } from "express";

import { CreatePermissionCommand } from "../../application/commands/create-permission.command";
import { DeletePermissionCommand } from "../../application/commands/delete-permission.command";
import { UpdatePermissionCommand } from "../../application/commands/update-permission.command";

import { GetPermissionByIdQuery } from "../../application/queries/permission/get-permission-by-id.query";
import { ListPermissionsQuery } from "../../application/queries/permission/list-permissions.query";

import { CreatePermissionUseCase } from "../../application/use-cases/create-permission.use-case";
import { GetPermissionByIdUseCase } from "../../application/use-cases/get-permission-by-id.use-case";
import { ListPermissionsUseCase } from "../../application/use-cases/list-permissions.use-case";
import { UpdatePermissionUseCase } from "../../application/use-cases/update-permission.use-case";
import { DeletePermissionUseCase } from "../../application/use-cases/delete-permission.use-case";


export class PermissionController {

    constructor(

        private readonly createPermissionUseCase: CreatePermissionUseCase,

        private readonly getPermissionByIdUseCase: GetPermissionByIdUseCase,

        private readonly listPermissionsUseCase: ListPermissionsUseCase,

        private readonly updatePermissionUseCase: UpdatePermissionUseCase,

        private readonly deletePermissionUseCase: DeletePermissionUseCase,

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


    async getById(

        req: Request,

        res: Response,

    ): Promise<void> {

        const query =
            new GetPermissionByIdQuery(

                String(req.params.id),

            );


        const result =
            await this.getPermissionByIdUseCase.execute(
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


    async list(

        req: Request,

        res: Response,

    ): Promise<void> {


        const query =
            new ListPermissionsQuery();


        const result =
            await this.listPermissionsUseCase.execute(
                query,
            );


        if (!result.isSuccess) {

            res.status(400).json({

                error: result.error,

            });

            return;

        }


        res.status(200).json(
            result.value,
        );

    }


    async update(

        req: Request,

        res: Response,

    ): Promise<void> {


        const command =
            new UpdatePermissionCommand(

                String(req.params.id),

                String(req.body.name),

                req.body.description ?? null,

            );


        const result =
            await this.updatePermissionUseCase.execute(
                command,
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


    async delete(

        req: Request,

        res: Response,

    ): Promise<void> {


        const command =
            new DeletePermissionCommand(

                String(req.params.id),

            );


        const result =
            await this.deletePermissionUseCase.execute(
                command,
            );


        if (!result.isSuccess) {

            res.status(404).json({

                error: result.error,

            });

            return;

        }


        res.status(204).send();

    }

}

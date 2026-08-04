import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

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


    async create(req: AuthRequest, res: Response): Promise<void> {

        const command =
            new CreatePermissionCommand(

                String(req.body.name),

                req.body.description ?? null,

                req.user!.tenantId,

                req.user!.userId,

            );


        const result =
            await this.createPermissionUseCase.execute(command);


        res.status(result.isSuccess ? 201 : 400)
            .json(
                result.isSuccess
                    ? result.value
                    : { error: result.error }
            );

    }


    async getById(req: AuthRequest, res: Response): Promise<void> {

        const result =
            await this.getPermissionByIdUseCase.execute(
                new GetPermissionByIdQuery(
                    String(req.params.id),
                ),
            );


        res.status(result.isSuccess ? 200 : 404)
            .json(
                result.isSuccess
                    ? result.value
                    : { error: result.error }
            );

    }


    async list(req: AuthRequest, res: Response): Promise<void> {

        const result =
            await this.listPermissionsUseCase.execute(
                new ListPermissionsQuery(),
            );


        res.status(result.isSuccess ? 200 : 400)
            .json(
                result.isSuccess
                    ? result.value
                    : { error: result.error }
            );

    }


    async update(req: AuthRequest, res: Response): Promise<void> {

        const command =
            new UpdatePermissionCommand(

                String(req.params.id),

                String(req.body.name),

                req.body.description ?? null,

                req.user!.tenantId,

                req.user!.userId,

            );


        const result =
            await this.updatePermissionUseCase.execute(command);


        res.status(result.isSuccess ? 200 : 404)
            .json(
                result.isSuccess
                    ? result.value
                    : { error: result.error }
            );

    }


    async delete(req: AuthRequest, res: Response): Promise<void> {

        const result =
            await this.deletePermissionUseCase.execute(

                new DeletePermissionCommand(

                    String(req.params.id),

                    req.user!.tenantId,

                    req.user!.userId,

                ),

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

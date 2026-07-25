import { Request, Response } from "express";

import { CreateRoleCommand } from "../../application/commands/create-role.command";
import { UpdateRoleCommand } from "../../application/commands/update-role.command";

import { GetRoleByIdQuery } from "../../application/queries/role/get-role-by-id.query";
import { ListRolesQuery } from "../../application/queries/role/list-roles.query";

import { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case";
import { GetRoleByIdUseCase } from "../../application/use-cases/get-role-by-id.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";
import { UpdateRoleUseCase } from "../../application/use-cases/update-role.use-case";


export class RoleController {

    constructor(

        private readonly createRoleUseCase: CreateRoleUseCase,

        private readonly getRoleByIdUseCase: GetRoleByIdUseCase,

        private readonly listRolesUseCase: ListRolesUseCase,

        private readonly updateRoleUseCase: UpdateRoleUseCase,

    ) {}


    async create(

        req: Request,

        res: Response,

    ): Promise<void> {

        const command =
            new CreateRoleCommand(

                String(req.body.name),

                req.body.description ?? null,

            );


        const result =
            await this.createRoleUseCase.execute(
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
            new GetRoleByIdQuery(

                String(req.params.id),

            );


        const result =
            await this.getRoleByIdUseCase.execute(
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
            new ListRolesQuery();


        const result =
            await this.listRolesUseCase.execute(
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
            new UpdateRoleCommand(

                String(req.params.id),

                String(req.body.name),

                req.body.description ?? null,

            );


        const result =
            await this.updateRoleUseCase.execute(
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


}

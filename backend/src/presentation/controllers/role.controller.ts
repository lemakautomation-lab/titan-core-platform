import { Request, Response } from "express";

import { GetRoleByIdQuery } from "../../application/queries/role/get-role-by-id.query";
import { ListRolesQuery } from "../../application/queries/role/list-roles.query";

import { GetRoleByIdUseCase } from "../../application/use-cases/get-role-by-id.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";

export class RoleController {

    constructor(

        private readonly getRoleByIdUseCase: GetRoleByIdUseCase,

        private readonly listRolesUseCase: ListRolesUseCase,

    ) {}

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

}

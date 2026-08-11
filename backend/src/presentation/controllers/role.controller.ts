import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import { CreateRoleCommand } from "../../application/commands/create-role.command";
import { UpdateRoleCommand } from "../../application/commands/update-role.command";
import { DeleteRoleCommand } from "../../application/commands/delete-role.command";
import { AssignPermissionToRoleCommand } from "../../application/commands/assign-permission-to-role.command";
import { DeletePermissionFromRoleCommand } from "../../application/commands/delete-permission-from-role.command";

import { GetRoleByIdQuery } from "../../application/queries/role/get-role-by-id.query";
import { ListRolesQuery } from "../../application/queries/role/list-roles.query";
import { GetRolePermissionsQuery } from "../../application/queries/role/get-role-permissions.query";

import { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case";
import { GetRoleByIdUseCase } from "../../application/use-cases/get-role-by-id.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";
import { UpdateRoleUseCase } from "../../application/use-cases/update-role.use-case";
import { DeleteRoleUseCase } from "../../application/use-cases/delete-role.use-case";
import { AssignPermissionToRoleUseCase } from "../../application/use-cases/assign-permission-to-role.use-case";
import { GetRolePermissionsUseCase } from "../../application/use-cases/get-role-permissions.use-case";
import { DeletePermissionFromRoleUseCase } from "../../application/use-cases/delete-permission-from-role.use-case";


export class RoleController {


    constructor(

        private readonly createRoleUseCase: CreateRoleUseCase,

        private readonly getRoleByIdUseCase: GetRoleByIdUseCase,

        private readonly listRolesUseCase: ListRolesUseCase,

        private readonly updateRoleUseCase: UpdateRoleUseCase,

        private readonly deleteRoleUseCase: DeleteRoleUseCase,

        private readonly assignPermissionToRoleUseCase: AssignPermissionToRoleUseCase,

        private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,

        private readonly deletePermissionFromRoleUseCase: DeletePermissionFromRoleUseCase,

    ) {}



    async create(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {

            res.status(401).json({
                error: "Unauthorized",
            });

            return;

        }

        const result =
            await this.createRoleUseCase.execute(

                new CreateRoleCommand(

                    String(req.body.name),

                    req.body.description ?? null,

                    authUser.tenantId,

                    authUser.userId,

                ),

            );

        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;

        }

        res.status(201).json(result.value);

    }

    async getById(req: AuthRequest, res: Response): Promise<void> {

    const authUser = req.user;

    if (!authUser) {
        res.status(401).json({
            error: "Unauthorized",
        });
        return;
    }

        const result =
            await this.getRoleByIdUseCase.execute(

                new GetRoleByIdQuery(
                String(req.params.id),
                authUser.tenantId,
            ),

            );

        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;

        }

        res.status(200).json(result.value);

    }

    async list(req: AuthRequest, res: Response): Promise<void> {

    const authUser = req.user;

    if (!authUser) {
        res.status(401).json({
            error: "Unauthorized",
        });
        return;
    }

        const result =
            await this.listRolesUseCase.execute(

                new ListRolesQuery(
                authUser.tenantId,
            ),

            );

        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;

        }

        res.status(200).json(result.value);

    }

    async update(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {

            res.status(401).json({
                error: "Unauthorized",
            });

            return;

        }

        const result =
            await this.updateRoleUseCase.execute(

                new UpdateRoleCommand(

                    String(req.params.id),

                    String(req.body.name),

                    req.body.description ?? null,

                    authUser.tenantId,

                    authUser.userId,

                ),

            );

        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;

        }

        res.status(200).json(result.value);

    }

    async delete(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {

            res.status(401).json({
                error: "Unauthorized",
            });

            return;

        }

        const result =
            await this.deleteRoleUseCase.execute(

                new DeleteRoleCommand(

                    String(req.params.id),

                    authUser.tenantId,

                    authUser.userId,

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

    async assignPermission(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;


        if (!authUser) {

            res.status(401).json({
                error: "Unauthorized",
            });

            return;

        }


        const result =
            await this.assignPermissionToRoleUseCase.execute(

                new AssignPermissionToRoleCommand(

                    String(req.params.roleId),

                    String(req.params.permissionId),

                    authUser.tenantId,

                    authUser.userId,

                ),

            );


        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;

        }


        res.status(201).json({

            message: "Permission assigned to role.",

        });

    }

    async getPermissions(req: AuthRequest, res: Response): Promise<void> {

    const authUser = req.user;

    if (!authUser) {
        res.status(401).json({
            error: "Unauthorized",
        });
        return;
    }

        const result =
            await this.getRolePermissionsUseCase.execute(

                new GetRolePermissionsQuery(
                String(req.params.id),
                authUser.tenantId,
            ),

            );

        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;

        }

        res.status(200).json(result.value);

    }
    async deletePermission(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;


        if (!authUser) {

            res.status(401).json({
                error: "Unauthorized",
            });

            return;

        }


        const result =
            await this.deletePermissionFromRoleUseCase.execute(

                new DeletePermissionFromRoleCommand(

                    String(req.params.roleId),

                    String(req.params.permissionId),

                    authUser.tenantId,

                    authUser.userId,

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








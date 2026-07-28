import { Request, Response } from "express";

import { CreateUserCommand } from "../../application/commands/create-user.command";
import { UpdateUserCommand } from "../../application/commands/update-user.command";
import { DeleteUserCommand } from "../../application/commands/delete-user.command";

import { GetUserByIdQuery } from "../../application/queries/user/get-user-by-id.query";
import { ListUsersQuery } from "../../application/queries/user/list-users.query";

import { AssignRoleToUserCommand } from "../../application/commands/assign-role-to-user.command";
import { GetUserRolesQuery } from "../../application/queries/user/get-user-roles.query";

import { AssignRoleToUserUseCase } from "../../application/use-cases/assign-role-to-user.use-case";
import { GetUserRolesUseCase } from "../../application/use-cases/get-user-roles.use-case";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";


export class UserController {

    constructor(

        private readonly createUserUseCase: CreateUserUseCase,

        private readonly getUserByIdUseCase: GetUserByIdUseCase,

        private readonly listUsersUseCase: ListUsersUseCase,

        private readonly updateUserUseCase: UpdateUserUseCase,

        private readonly deleteUserUseCase: DeleteUserUseCase,

private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,

private readonly getUserRolesUseCase: GetUserRolesUseCase,

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
            await this.createUserUseCase.execute(command);

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
            await this.getUserByIdUseCase.execute(query);

        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;

        }

        res.status(200).json(result.value);

    }


    async list(
        req: Request,
        res: Response,
    ): Promise<void> {

        const tenantId = String(req.query.tenantId ?? "");

        if (!tenantId) {

            res.status(400).json({
                error: "tenantId query parameter is required.",
            });

            return;

        }

        const result =
            await this.listUsersUseCase.execute(
                new ListUsersQuery(
                    tenantId,
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


    async update(
        req: Request,
        res: Response,
    ): Promise<void> {

        const command =
            new UpdateUserCommand(

                String(req.params.id),

                req.body.organisationId ?? null,

                req.body.email,

                req.body.password ?? null,

                req.body.firstName ?? null,

                req.body.lastName ?? null,

            );

        const result =
            await this.updateUserUseCase.execute(command);

        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;

        }

        res.status(200).json(result.value);

    }


    async delete(
        req: Request,
        res: Response,
    ): Promise<void> {

        const command =
            new DeleteUserCommand(
                String(req.params.id),
            );

        const result =
            await this.deleteUserUseCase.execute(command);

        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;

        }

        res.status(204).send();

    }
    async assignRole(
        req: Request,
        res: Response,
    ): Promise<void> {

        const command =
            new AssignRoleToUserCommand(

                String(req.params.userId),

                String(req.params.roleId),

            );

        const result =
            await this.assignRoleToUserUseCase.execute(command);

        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;

        }

        res.status(204).send();

    }


    async getRoles(
        req: Request,
        res: Response,
    ): Promise<void> {

        const result =
            await this.getUserRolesUseCase.execute(

                new GetUserRolesQuery(

                    String(req.params.userId),

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
}


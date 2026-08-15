import { Response } from "express";

import { CreateUserCommand } from "../../application/commands/create-user.command";
import { UpdateUserCommand } from "../../application/commands/update-user.command";
import { DeleteUserCommand } from "../../application/commands/delete-user.command";
import { AssignRoleToUserCommand } from "../../application/commands/assign-role-to-user.command";
import { RemoveRoleFromUserCommand } from "../../application/commands/remove-role-from-user.command";
import { UnlockUserCommand } from "../../application/commands/unlock-user.command";

import { GetUserByIdQuery } from "../../application/queries/user/get-user-by-id.query";
import { ListUsersQuery } from "../../application/queries/user/list-users.query";
import { GetUserRolesQuery } from "../../application/queries/user/get-user-roles.query";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import { AssignRoleToUserUseCase } from "../../application/use-cases/assign-role-to-user.use-case";
import { RemoveRoleFromUserUseCase } from "../../application/use-cases/remove-role-from-user.use-case";
import { GetUserRolesUseCase } from "../../application/use-cases/get-user-roles.use-case";
import { UnlockUserUseCase } from "../../application/use-cases/users/unlock-user.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class UserController {

    constructor(

        private readonly createUserUseCase: CreateUserUseCase,

        private readonly getUserByIdUseCase: GetUserByIdUseCase,

        private readonly listUsersUseCase: ListUsersUseCase,

        private readonly updateUserUseCase: UpdateUserUseCase,

        private readonly deleteUserUseCase: DeleteUserUseCase,

        private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,

        private readonly removeRoleFromUserUseCase: RemoveRoleFromUserUseCase,

        private readonly getUserRolesUseCase: GetUserRolesUseCase,

        private readonly unlockUserUseCase: UnlockUserUseCase,

    ) {}


    async create(
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

        const requestedTenantId =
            req.body.tenantId;

        if (
            requestedTenantId &&
            requestedTenantId !== authUser.tenantId
        ) {

            res.status(403).json({
                error: "Forbidden",
            });

            return;
        }

        const command =
            new CreateUserCommand(
                authUser.tenantId,
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

        const result =
            await this.getUserByIdUseCase.execute(
                new GetUserByIdQuery(
                    String(req.params.id),
                    authUser.tenantId,
                ),
            );

        if (!result.isSuccess) {

            if (result.error === "Forbidden.") {

                res.status(403).json({
                    error: result.error,
                });

                return;
            }

            res.status(404).json({
                error: result.error,
            });

            return;
        }

        res.status(200).json(result.value);
    }


    async list(
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

        const tenantId =
            String(req.query.tenantId ?? "");

        if (!tenantId) {

            res.status(400).json({
                error:
                    "tenantId query parameter is required.",
            });

            return;
        }

        if (
            tenantId !==
            authUser.tenantId
        ) {

            res.status(403).json({
                error: "Forbidden",
            });

            return;
        }

        const result =
            await this.listUsersUseCase.execute(
                new ListUsersQuery(
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


    async update(
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

        const command =
            new UpdateUserCommand(
                String(req.params.id),
                req.body.organisationId ?? null,
                req.body.email,
                req.body.password ?? null,
                req.body.firstName ?? null,
                req.body.lastName ?? null,
                authUser.tenantId,
            );

        const result =
            await this.updateUserUseCase.execute(
                command,
            );

        if (!result.isSuccess) {

            if (result.error === "Forbidden.") {

                res.status(403).json({
                    error: result.error,
                });

                return;
            }

            res.status(400).json({
                error: result.error,
            });

            return;
        }

        res.status(200).json(result.value);
    }


    async delete(
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

        const result =
            await this.deleteUserUseCase.execute(
                new DeleteUserCommand(
                    String(req.params.id),
                    authUser.tenantId,
                ),
            );

        if (!result.isSuccess) {

            if (result.error === "Forbidden.") {

                res.status(403).json({
                    error: result.error,
                });

                return;
            }

            res.status(404).json({
                error: result.error,
            });

            return;
        }

        res.status(204).send();
    }


    async unlock(
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

        try {

            const result =
                await this.unlockUserUseCase.execute(

                    new UnlockUserCommand(

                        String(req.params.id),

                        authUser.tenantId,

                        authUser.userId,

                    ),

                );

            res.status(200).json(result);

        } catch (error: any) {

            if (
                error?.message ===
                "User not found"
            ) {

                res.status(404).json({
                    success: false,
                    error: {
                        code: "USER_NOT_FOUND",
                        message: error.message,
                    },
                });

                return;
            }

            if (
                error?.message ===
                "Forbidden"
            ) {

                res.status(403).json({
                    success: false,
                    error: {
                        code: "FORBIDDEN",
                        message: error.message,
                    },
                });

                return;
            }

            if (
                error?.message ===
                "User does not belong to tenant"
            ) {

                res.status(403).json({
                    success: false,
                    error: {
                        code: "FORBIDDEN",
                        message: error.message,
                    },
                });

                return;
            }

            if (
                error?.message ===
                "User is not locked"
            ) {

                res.status(409).json({
                    success: false,
                    error: {
                        code: "USER_NOT_LOCKED",
                        message: error.message,
                    },
                });

                return;
            }

            throw error;
        }
    }


    async assignRole(
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

        const result =
            await this.assignRoleToUserUseCase.execute(
                new AssignRoleToUserCommand(
                    String(req.params.userId),
                    String(req.params.roleId),
                    authUser.tenantId,
                    authUser.userId,
                ),
            );

        if (!result.isSuccess) {

            if (result.error === "Forbidden.") {

                res.status(403).json({
                    error: result.error,
                });

                return;
            }

            res.status(400).json({
                error: result.error,
            });

            return;
        }

        res.status(204).send();
    }


    async removeRole(
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

        const result =
            await this.removeRoleFromUserUseCase.execute(
                new RemoveRoleFromUserCommand(
                    String(req.params.userId),
                    String(req.params.roleId),
                    authUser.tenantId,
                    authUser.userId,
                ),
            );

        if (!result.isSuccess) {

            if (result.error === "Forbidden.") {

                res.status(403).json({
                    error: result.error,
                });

                return;
            }

            res.status(400).json({
                error: result.error,
            });

            return;
        }

        res.status(204).send();
    }


    async getRoles(
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

        const result =
            await this.getUserRolesUseCase.execute(
                new GetUserRolesQuery(
                    String(req.params.userId),
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
}

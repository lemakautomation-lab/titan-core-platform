import { DatabaseService } from "../database/database.service";

import { PrismaTenantRepository } from "../repositories/tenant.repository";
import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaRoleRepository } from "../repositories/role.repository";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import { AssignRoleToUserUseCase } from "../../application/use-cases/assign-role-to-user.use-case";
import { RemoveRoleFromUserUseCase } from "../../application/use-cases/remove-role-from-user.use-case";
import { GetUserRolesUseCase } from "../../application/use-cases/get-user-roles.use-case";

import { auditLogModule } from "./audit-log.module";

const databaseService = new DatabaseService();

const tenantRepository =
    new PrismaTenantRepository(
        databaseService,
    );

const userRepository =
    new PrismaUserRepository(
        databaseService,
    );

const roleRepository =
    new PrismaRoleRepository(
        databaseService,
    );

export const userModule = {

    createUserUseCase:

        new CreateUserUseCase(
            userRepository,
            tenantRepository,
            auditLogModule.auditLogService,
        ),

    getUserByIdUseCase:

        new GetUserByIdUseCase(
            userRepository,
        ),

    listUsersUseCase:

        new ListUsersUseCase(
            userRepository,
            tenantRepository,
        ),

    updateUserUseCase:

        new UpdateUserUseCase(
            userRepository,
            auditLogModule.auditLogService,
        ),

    deleteUserUseCase:

        new DeleteUserUseCase(
            userRepository,
            auditLogModule.auditLogService,
        ),

    assignRoleToUserUseCase:

        new AssignRoleToUserUseCase(
            userRepository,
            roleRepository,
            auditLogModule.auditLogService,
        ),

    removeRoleFromUserUseCase:

        new RemoveRoleFromUserUseCase(
            userRepository,
            roleRepository,
            auditLogModule.auditLogService,
        ),

    getUserRolesUseCase:

        new GetUserRolesUseCase(
            userRepository,
            auditLogModule.auditLogService,
        ),

};

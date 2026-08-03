import { DatabaseService } from "../database/database.service";

import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaRoleRepository } from "../repositories/role.repository";

import { PermissionResolutionService } from "../../application/services/permission-resolution.service";
import { AuthorizationService } from "../../application/services/authorization.service";

const databaseService =
    new DatabaseService();

const userRepository =
    new PrismaUserRepository(
        databaseService,
    );

const roleRepository =
    new PrismaRoleRepository(
        databaseService,
    );

const permissionResolutionService =
    new PermissionResolutionService(
        userRepository,
        roleRepository,
    );

const authorizationService =
    new AuthorizationService(
        permissionResolutionService,
    );

export const authorizationModule = {

    authorizationService,

    permissionResolutionService,

};

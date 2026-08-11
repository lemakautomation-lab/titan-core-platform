import { DatabaseService } from "../database/database.service";

import { PrismaRoleRepository } from "../repositories/role.repository";
import { PrismaPermissionRepository } from "../repositories/permission.repository";
import { PrismaRolePermissionRepository } from "../repositories/role-permission.repository";

import { CreateRoleUseCase } from "../../application/use-cases/create-role.use-case";
import { GetRoleByIdUseCase } from "../../application/use-cases/get-role-by-id.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";
import { UpdateRoleUseCase } from "../../application/use-cases/update-role.use-case";
import { DeleteRoleUseCase } from "../../application/use-cases/delete-role.use-case";

import { AssignPermissionToRoleUseCase } from "../../application/use-cases/assign-permission-to-role.use-case";
import { GetRolePermissionsUseCase } from "../../application/use-cases/get-role-permissions.use-case";
import { DeletePermissionFromRoleUseCase } from "../../application/use-cases/delete-permission-from-role.use-case";

import { auditLogModule } from "./audit-log.module";


const databaseService = new DatabaseService();


export const roleRepository =
    new PrismaRoleRepository(
        databaseService,
    );


export const permissionRepository =
    new PrismaPermissionRepository(
        databaseService,
    );


export const rolePermissionRepository =
    new PrismaRolePermissionRepository(
        databaseService,
    );


export const roleModule = {


    roleRepository,


    permissionRepository,


    rolePermissionRepository,


    createRoleUseCase:
        new CreateRoleUseCase(
            roleRepository,
            auditLogModule.auditLogService,
        ),



    getRoleByIdUseCase:
        new GetRoleByIdUseCase(
            roleRepository,
        ),



    listRolesUseCase:
        new ListRolesUseCase(
            roleRepository,
        ),



    updateRoleUseCase:
        new UpdateRoleUseCase(
            roleRepository,
            auditLogModule.auditLogService,
        ),



    deleteRoleUseCase:
        new DeleteRoleUseCase(
            roleRepository,
            auditLogModule.auditLogService,
        ),



    assignPermissionToRoleUseCase:
        new AssignPermissionToRoleUseCase(
            roleRepository,
            permissionRepository,
            rolePermissionRepository,
            auditLogModule.auditLogService,
        ),



    getRolePermissionsUseCase:
        new GetRolePermissionsUseCase(
            roleRepository,
        ),



    deletePermissionFromRoleUseCase:
        new DeletePermissionFromRoleUseCase(
            roleRepository,
            permissionRepository,
            rolePermissionRepository,
            auditLogModule.auditLogService,
        ),
};







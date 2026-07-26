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


const databaseService = new DatabaseService();


const roleRepository =

    new PrismaRoleRepository(

        databaseService,

    );


const permissionRepository =

    new PrismaPermissionRepository(

        databaseService,

    );


const rolePermissionRepository =

    new PrismaRolePermissionRepository(

        databaseService,

    );


export const roleModule = {


    createRoleUseCase:

        new CreateRoleUseCase(

            roleRepository,

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

        ),


    deleteRoleUseCase:

        new DeleteRoleUseCase(

            roleRepository,

        ),


    assignPermissionToRoleUseCase:

        new AssignPermissionToRoleUseCase(

            roleRepository,

            permissionRepository,

            rolePermissionRepository,

        ),


    getRolePermissionsUseCase:

        new GetRolePermissionsUseCase(

            roleRepository,

            rolePermissionRepository,

            permissionRepository,

        ),


};

import { DatabaseService } from "../database/database.service";

import { PrismaPermissionRepository } from "../repositories/permission.repository";

import { CreatePermissionUseCase } from "../../application/use-cases/create-permission.use-case";
import { GetPermissionByIdUseCase } from "../../application/use-cases/get-permission-by-id.use-case";
import { ListPermissionsUseCase } from "../../application/use-cases/list-permissions.use-case";
import { UpdatePermissionUseCase } from "../../application/use-cases/update-permission.use-case";


const databaseService = new DatabaseService();


const permissionRepository =
    new PrismaPermissionRepository(
        databaseService,
    );


export const permissionModule = {

    createPermissionUseCase:

        new CreatePermissionUseCase(
            permissionRepository,
        ),


    getPermissionByIdUseCase:

        new GetPermissionByIdUseCase(
            permissionRepository,
        ),


    listPermissionsUseCase:

        new ListPermissionsUseCase(
            permissionRepository,
        ),


    updatePermissionUseCase:

        new UpdatePermissionUseCase(
            permissionRepository,
        ),

};

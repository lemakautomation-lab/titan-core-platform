import { DatabaseService } from "../database/database.service";

import { PrismaPermissionRepository } from "../repositories/permission.repository";

import { CreatePermissionUseCase } from "../../application/use-cases/create-permission.use-case";


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

};

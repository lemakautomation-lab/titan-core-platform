import { DatabaseService } from "../database/database.service";

import { PrismaRoleRepository } from "../repositories/role.repository";

import { GetRoleByIdUseCase } from "../../application/use-cases/get-role-by-id.use-case";
import { ListRolesUseCase } from "../../application/use-cases/list-roles.use-case";


const databaseService = new DatabaseService();


const roleRepository =
    new PrismaRoleRepository(
        databaseService,
    );


export const roleModule = {

    getRoleByIdUseCase:

        new GetRoleByIdUseCase(
            roleRepository,
        ),


    listRolesUseCase:

        new ListRolesUseCase(
            roleRepository,
        ),

};

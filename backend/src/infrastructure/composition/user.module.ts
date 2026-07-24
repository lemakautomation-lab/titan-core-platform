import { DatabaseService } from "../database/database.service";

import { PrismaTenantRepository } from "../repositories/tenant.repository";
import { PrismaUserRepository } from "../repositories/user.repository";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";


const databaseService = new DatabaseService();


const tenantRepository =
    new PrismaTenantRepository(
        databaseService,
    );


const userRepository =
    new PrismaUserRepository(
        databaseService,
    );


export const userModule = {

    createUserUseCase:

        new CreateUserUseCase(
            userRepository,
            tenantRepository,
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
        ),


    deleteUserUseCase:

        new DeleteUserUseCase(
            userRepository,
        ),

};

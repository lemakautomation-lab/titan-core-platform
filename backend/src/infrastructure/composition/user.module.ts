import { DatabaseService } from "../database/database.service";

import { PrismaTenantRepository } from "../repositories/tenant.repository";
import { PrismaUserRepository } from "../repositories/user.repository";

import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";


const databaseService = new DatabaseService();

const tenantRepository =
    new PrismaTenantRepository(databaseService);

const userRepository =
    new PrismaUserRepository(databaseService);


export const userModule = {

    createUserUseCase:

        new CreateUserUseCase(
            userRepository,
            tenantRepository,
        ),

};

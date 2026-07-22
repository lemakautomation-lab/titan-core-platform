import { DatabaseService } from "../database/database.service";

import { PrismaTenantRepository } from "../repositories/tenant.repository";

import { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";

import { GetTenantByIdUseCase } from "../../application/use-cases/get-tenant-by-id.use-case";


const databaseService = new DatabaseService();

const tenantRepository =
    new PrismaTenantRepository(databaseService);


export const tenantModule = {

    createTenantUseCase:
        new CreateTenantUseCase(
            tenantRepository,
        ),

    getTenantByIdUseCase:
        new GetTenantByIdUseCase(
            tenantRepository,
        ),

};
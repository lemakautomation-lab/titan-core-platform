import { DatabaseService } from "../database/database.service";

import { PrismaTenantRepository } from "../repositories/tenant.repository";

import { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import { GetTenantByIdUseCase } from "../../application/use-cases/get-tenant-by-id.use-case";
import { ListTenantsUseCase } from "../../application/use-cases/list-tenants.use-case";
import { UpdateTenantUseCase } from "../../application/use-cases/update-tenant.use-case";
import { DeleteTenantUseCase } from "../../application/use-cases/delete-tenant.use-case";


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

    listTenantsUseCase:
        new ListTenantsUseCase(
            tenantRepository,
        ),

    updateTenantUseCase:
        new UpdateTenantUseCase(
            tenantRepository,
        ),

    deleteTenantUseCase:
        new DeleteTenantUseCase(
            tenantRepository,
        ),

};
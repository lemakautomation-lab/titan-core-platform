import { Router } from "express";

import { healthRoutes } from "../../modules/health";
import { authRoutes } from "../../modules/auth";
import { userRoutes } from "../../modules/users";

import { createTenantRoutes } from "../../presentation/routes/tenant.routes";
import { TenantController } from "../../presentation/controllers/tenant.controller";
import { tenantModule } from "../../infrastructure/composition/tenant.module";

import { createOrganisationRoutes } from "../../presentation/routes/organisation.routes";
import { OrganisationController } from "../../presentation/controllers/organisation.controller";
import { organisationModule } from "../../infrastructure/composition/organisation.module";


const router = Router();


const tenantController = new TenantController(
    tenantModule.createTenantUseCase,
    tenantModule.getTenantByIdUseCase,
    tenantModule.listTenantsUseCase,
    tenantModule.updateTenantUseCase,
    tenantModule.deleteTenantUseCase,
);



const organisationController =
    new OrganisationController(

        organisationModule.createOrganisationUseCase,

        organisationModule.getOrganisationByIdUseCase,

        organisationModule.listOrganisationsUseCase,

        organisationModule.updateOrganisationUseCase,

    );



router.use("/", healthRoutes);

router.use("/auth", authRoutes);

router.use("/users", userRoutes);



router.use(
    "/tenants",
    createTenantRoutes(tenantController),
);



router.use(
    "/organisations",
    createOrganisationRoutes(
        organisationController,
    ),
);



export default router;

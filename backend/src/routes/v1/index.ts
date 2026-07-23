import { Router } from "express";

import { healthRoutes } from "../../modules/health";
import { authRoutes } from "../../modules/auth";

import { createUserRoutes } from "../../presentation/routes/user.routes";
import { UserController } from "../../presentation/controllers/user.controller";
import { userModule } from "../../infrastructure/composition/user.module";


import { createTenantRoutes } from "../../presentation/routes/tenant.routes";
import { TenantController } from "../../presentation/controllers/tenant.controller";
import { tenantModule } from "../../infrastructure/composition/tenant.module";


import { createOrganisationRoutes } from "../../presentation/routes/organisation.routes";
import { OrganisationController } from "../../presentation/controllers/organisation.controller";
import { organisationModule } from "../../infrastructure/composition/organisation.module";


const router = Router();


const userController =
    new UserController(
        userModule.createUserUseCase,
        userModule.getUserByIdUseCase,
    );


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

        organisationModule.deleteOrganisationUseCase,

    );


router.use("/", healthRoutes);

router.use("/auth", authRoutes);


router.use(
    "/users",
    createUserRoutes(userController),
);


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

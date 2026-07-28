import { Router } from "express";

import { healthRoutes } from "../../modules/health";
import { createAuthRoutes, AuthController } from "../../modules/auth";

import { createUserRoutes } from "../../presentation/routes/user.routes";
import { UserController } from "../../presentation/controllers/user.controller";
import { userModule } from "../../infrastructure/composition/user.module";

import { createTenantRoutes } from "../../presentation/routes/tenant.routes";
import { TenantController } from "../../presentation/controllers/tenant.controller";
import { tenantModule } from "../../infrastructure/composition/tenant.module";

import { createOrganisationRoutes } from "../../presentation/routes/organisation.routes";
import { OrganisationController } from "../../presentation/controllers/organisation.controller";
import { organisationModule } from "../../infrastructure/composition/organisation.module";

import { createRoleRoutes } from "../../presentation/routes/role.routes";
import { RoleController } from "../../presentation/controllers/role.controller";
import { roleModule } from "../../infrastructure/composition/role.module";

import { createPermissionRoutes } from "../../presentation/routes/permission.routes";
import { PermissionController } from "../../presentation/controllers/permission.controller";
import { permissionModule } from "../../infrastructure/composition/permission.module";

import { createSessionRoutes } from "../../presentation/routes/session.routes";
import { SessionController } from "../../presentation/controllers/session.controller";
import { sessionModule } from "../../infrastructure/composition/session.module";

const router = Router();

const authController = new AuthController();

const userController =
    new UserController(
        userModule.createUserUseCase,
        userModule.getUserByIdUseCase,
        userModule.listUsersUseCase,
        userModule.updateUserUseCase,
        userModule.deleteUserUseCase,
        userModule.assignRoleToUserUseCase,
        userModule.getUserRolesUseCase,
    );

const tenantController =
    new TenantController(
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

const roleController =
    new RoleController(
        roleModule.createRoleUseCase,
        roleModule.getRoleByIdUseCase,
        roleModule.listRolesUseCase,
        roleModule.updateRoleUseCase,
        roleModule.deleteRoleUseCase,
        roleModule.assignPermissionToRoleUseCase,
        roleModule.getRolePermissionsUseCase,
    );

const permissionController =
    new PermissionController(
        permissionModule.createPermissionUseCase,
        permissionModule.getPermissionByIdUseCase,
        permissionModule.listPermissionsUseCase,
        permissionModule.updatePermissionUseCase,
        permissionModule.deletePermissionUseCase,
    );

const sessionController =
    new SessionController(
        sessionModule.getSessionByIdUseCase,
    );

router.use("/", healthRoutes);

router.use("/auth", createAuthRoutes(authController));

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

router.use(
    "/roles",
    createRoleRoutes(
        roleController,
    ),
);

router.use(
    "/permissions",
    createPermissionRoutes(
        permissionController,
    ),
);

router.use(
    "/sessions",
    createSessionRoutes(
        sessionController,
    ),
);

export default router;




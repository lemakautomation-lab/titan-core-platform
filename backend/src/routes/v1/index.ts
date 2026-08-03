import { Router } from "express";

import { createRoleRoutes } from "../../presentation/routes/role.routes";
import { createUserRoutes } from "../../presentation/routes/user.routes";
import { createTenantRoutes } from "../../presentation/routes/tenant.routes";
import { createOrganisationRoutes } from "../../presentation/routes/organisation.routes";
import { createPermissionRoutes } from "../../presentation/routes/permission.routes";
import { createAuditLogRoutes } from "../../presentation/routes/audit-log.routes";
import { createHealthRoutes } from "../../presentation/routes/health.routes";


import { RoleController } from "../../presentation/controllers/role.controller";
import { UserController } from "../../presentation/controllers/user.controller";
import { TenantController } from "../../presentation/controllers/tenant.controller";
import { OrganisationController } from "../../presentation/controllers/organisation.controller";
import { PermissionController } from "../../presentation/controllers/permission.controller";
import { AuditLogController } from "../../presentation/controllers/audit-log.controller";
import { HealthController } from "../../presentation/controllers/health.controller";


import { createAuthRoutes } from "../../modules/auth/auth.routes";
import { AuthController } from "../../modules/auth/auth.controller";


import { roleModule } from "../../infrastructure/composition/role.module";
import { userModule } from "../../infrastructure/composition/user.module";
import { tenantModule } from "../../infrastructure/composition/tenant.module";
import { organisationModule } from "../../infrastructure/composition/organisation.module";
import { permissionModule } from "../../infrastructure/composition/permission.module";
import { auditLogModule } from "../../infrastructure/composition/audit-log.module";
import { DatabaseService } from "../../infrastructure/database/database.service";



const router = Router();

const healthController = new HealthController(new DatabaseService());



const authController =
    new AuthController();



const roleController =
    new RoleController(

        roleModule.createRoleUseCase,

        roleModule.getRoleByIdUseCase,

        roleModule.listRolesUseCase,

        roleModule.updateRoleUseCase,

        roleModule.deleteRoleUseCase,

        roleModule.assignPermissionToRoleUseCase,

        roleModule.getRolePermissionsUseCase,

        roleModule.deletePermissionFromRoleUseCase,

    );



const userController =
    new UserController(

        userModule.createUserUseCase,

        userModule.getUserByIdUseCase,

        userModule.listUsersUseCase,

        userModule.updateUserUseCase,

        userModule.deleteUserUseCase,

        userModule.assignRoleToUserUseCase,

        userModule.removeRoleFromUserUseCase,

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



const permissionController =
    new PermissionController(

        permissionModule.createPermissionUseCase,

        permissionModule.getPermissionByIdUseCase,

        permissionModule.listPermissionsUseCase,

        permissionModule.updatePermissionUseCase,

        permissionModule.deletePermissionUseCase,

    );



const auditLogController =
    new AuditLogController(

        auditLogModule.getAuditLogsQuery,

        auditLogModule.getAuditLogByIdQuery,

    );



router.use(
    "/health",
    createHealthRoutes(healthController),
);


router.use(
    "/auth",
    createAuthRoutes(authController),
);



router.use(
    "/roles",
    createRoleRoutes(roleController),
);



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
    createOrganisationRoutes(organisationController),
);



router.use(
    "/permissions",
    createPermissionRoutes(permissionController),
);



router.use(
    "/audit-logs",
    createAuditLogRoutes(auditLogController),
);



export default router;




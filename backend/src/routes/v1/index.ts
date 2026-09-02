import { Router } from "express";

import { createRoleRoutes } from "../../presentation/routes/role.routes";
import { createUserRoutes } from "../../presentation/routes/user.routes";
import { createTenantRoutes } from "../../presentation/routes/tenant.routes";
import { createOrganisationRoutes } from "../../presentation/routes/organisation.routes";
import { createPermissionRoutes } from "../../presentation/routes/permission.routes";
import { createAuditLogRoutes } from "../../presentation/routes/audit-log.routes";
import { createHealthRoutes } from "../../presentation/routes/health.routes";
import { createSecurityRoutes } from "../../presentation/routes/security.routes";
import { createSessionRoutes } from "../../presentation/routes/session.routes";
import { createAthleteRelationshipRoutes } from "../../presentation/routes/athlete-relationship.routes";
import { createAthleteDigitalTwinRoutes } from "../../presentation/routes/athlete-digital-twin.routes";
import { createSportRoutes } from "../../presentation/routes/sport.routes";
import { createExerciseRoutes } from "../../presentation/routes/exercise.routes";
import { createPerformanceMetricRoutes } from "../../presentation/routes/performance-metric.routes";
import { createWorkoutProgrammeRoutes } from "../../presentation/routes/workout-programme.routes";
import { createProductRoutes } from "../../presentation/routes/product.routes";
import { createPerformanceMeasurementRoutes } from "../../presentation/routes/performance-measurement.routes";

import { RoleController } from "../../presentation/controllers/role.controller";
import { UserController } from "../../presentation/controllers/user.controller";
import { TenantController } from "../../presentation/controllers/tenant.controller";
import { OrganisationController } from "../../presentation/controllers/organisation.controller";
import { PermissionController } from "../../presentation/controllers/permission.controller";
import { AuditLogController } from "../../presentation/controllers/audit-log.controller";
import { HealthController } from "../../presentation/controllers/health.controller";
import { SecurityController } from "../../presentation/controllers/security.controller";
import { SessionController } from "../../presentation/controllers/session.controller";
import { AthleteRelationshipController } from "../../presentation/controllers/athlete-relationship.controller";
import { AthleteDigitalTwinController } from "../../presentation/controllers/athlete-digital-twin.controller";
import { SportController } from "../../presentation/controllers/sport.controller";
import { ExerciseController } from "../../presentation/controllers/exercise.controller";
import { PerformanceMetricController } from "../../presentation/controllers/performance-metric.controller";
import { WorkoutProgrammeController } from "../../presentation/controllers/workout-programme.controller";
import { ProductController } from "../../presentation/controllers/product.controller";
import { PerformanceMeasurementController } from "../../presentation/controllers/performance-measurement.controller";

import { createAuthRoutes } from "../../modules/auth/auth.routes";
import { AuthController } from "../../modules/auth/auth.controller";

import { roleModule } from "../../infrastructure/composition/role.module";
import { userModule } from "../../infrastructure/composition/user.module";
import { tenantModule } from "../../infrastructure/composition/tenant.module";
import { organisationModule } from "../../infrastructure/composition/organisation.module";
import { permissionModule } from "../../infrastructure/composition/permission.module";
import { auditLogModule } from "../../infrastructure/composition/audit-log.module";
import { DatabaseService } from "../../infrastructure/database/database.service";
import { sessionModule } from "../../infrastructure/composition/session.module";
import { athleteRelationshipModule } from "../../infrastructure/composition/athlete-relationship.module";
import { athleteDigitalTwinModule } from "../../infrastructure/composition/athlete-digital-twin.module";
import { sportModule } from "../../infrastructure/composition/sport.module";
import { exerciseModule } from "../../infrastructure/composition/exercise.module";
import { performanceMetricModule } from "../../infrastructure/composition/performance-metric.module";
import { workoutProgrammeModule } from "../../infrastructure/composition/workout-programme.module";
import { productModule } from "../../infrastructure/composition/product.module";
import { performanceMeasurementModule } from "../../infrastructure/composition/performance-measurement.module";

const router = Router();

const healthController =
    new HealthController(
        new DatabaseService(),
    );

const securityController =
    new SecurityController(
        auditLogModule.securityAnalyticsService,
    );

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
        userModule.unlockUserUseCase,
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

const sessionController =
    new SessionController(
        sessionModule.getSessionByIdUseCase,
    );

const athleteRelationshipController =
    new AthleteRelationshipController(
        athleteRelationshipModule.createAthleteRelationshipUseCase,
        athleteRelationshipModule.getAthleteRelationshipByIdUseCase,
        athleteRelationshipModule.listAthleteRelationshipsUseCase,
    );

const athleteDigitalTwinController =
    new AthleteDigitalTwinController(
        athleteDigitalTwinModule.createAthleteDigitalTwinUseCase,
        athleteDigitalTwinModule.getAthleteDigitalTwinByIdUseCase,
        athleteDigitalTwinModule.getAthleteDigitalTwinByAthleteIdUseCase,
        athleteDigitalTwinModule.updateAthleteDigitalTwinLifecycleUseCase,
    );

const sportController =
    new SportController(
        sportModule.createSportUseCase,
        sportModule.getSportByIdUseCase,
        sportModule.listSportsUseCase,
        sportModule.updateSportUseCase,
        sportModule.deleteSportUseCase,
    );

const performanceMetricController =
    new PerformanceMetricController(
        performanceMetricModule.createPerformanceMetricUseCase,
        performanceMetricModule.getPerformanceMetricByIdUseCase,
        performanceMetricModule.listPerformanceMetricsUseCase,
        performanceMetricModule.updatePerformanceMetricUseCase,
        performanceMetricModule.deletePerformanceMetricUseCase,
    );

const exerciseController =
    new ExerciseController(
        exerciseModule.createExerciseUseCase,
        exerciseModule.getExerciseByIdUseCase,
        exerciseModule.listExercisesUseCase,
        exerciseModule.updateExerciseUseCase,
        exerciseModule.deleteExerciseUseCase,
        exerciseModule.updateExerciseStatusUseCase,
    );

const workoutProgrammeController =
    new WorkoutProgrammeController(
        workoutProgrammeModule.createWorkoutProgrammeUseCase,
        workoutProgrammeModule.getWorkoutProgrammeByIdUseCase,
        workoutProgrammeModule.listWorkoutProgrammesUseCase,
        workoutProgrammeModule.listWorkoutProgrammesByAthleteUseCase,
        workoutProgrammeModule.updateWorkoutProgrammeUseCase,
        workoutProgrammeModule.deleteWorkoutProgrammeUseCase,
        workoutProgrammeModule.updateWorkoutProgrammeStatusUseCase,
        workoutProgrammeModule.adaptWorkoutProgrammeFromPerformanceUseCase,
    );

const productController =
    new ProductController(
        productModule.createProductUseCase,
        productModule.getProductByIdUseCase,
        productModule.listProductsUseCase,
        productModule.updateProductUseCase,
        productModule.deleteProductUseCase,
    );
const performanceMeasurementController =
    new PerformanceMeasurementController(
        performanceMeasurementModule.createUseCase,
        performanceMeasurementModule.createCorrectionUseCase,
        performanceMeasurementModule.listUseCase,
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
    createAuthRoutes(
        authController,
    ),
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
    "/sessions",
    createSessionRoutes(sessionController),
);

router.use(
    "/athlete-relationships",
    createAthleteRelationshipRoutes(
        athleteRelationshipController,
    ),
);

router.use(
    "/athlete-digital-twins",
    createAthleteDigitalTwinRoutes(
        athleteDigitalTwinController,
    ),
);

router.use(
    "/sports",
    createSportRoutes(
        sportController,
    ),
);

router.use(
    "/products",
    createProductRoutes(
        productController,
    ),
);
router.use(
    "/permissions",
    createPermissionRoutes(permissionController),
);

router.use(
    "/audit-logs",
    createAuditLogRoutes(auditLogController),
);

router.use(
    "/security",
    createSecurityRoutes(securityController),
);

router.use(
    "/performance-metrics",
    createPerformanceMetricRoutes(
        performanceMetricController,
    ),
);

router.use(
    "/performance-measurements",
    createPerformanceMeasurementRoutes(performanceMeasurementController),
);

router.use(
    "/exercises",
    createExerciseRoutes(
        exerciseController,
    ),
);

router.use(
    "/workout-programmes",
    createWorkoutProgrammeRoutes(
        workoutProgrammeController,
    ),
);

export default router;

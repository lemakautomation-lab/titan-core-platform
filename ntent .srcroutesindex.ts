[1mdiff --git a/backend/src/routes/index.ts b/backend/src/routes/index.ts[m
[1mindex 62cb2be..0909fea 100644[m
[1m--- a/backend/src/routes/index.ts[m
[1m+++ b/backend/src/routes/index.ts[m
[36m@@ -1,15 +1,37 @@[m
 import { Router } from "express";[m
[31m-import usersRoutes from "../modules/users/routes/users.routes";[m
[31m-import protectedRoutes from "./protected.routes";[m
[31m-import adminRoutes from "./admin.routes";[m
[31m-import apiRoutes from "./api";[m
[32m+[m
[32m+[m[32mimport { healthRoutes } from "../../modules/health";[m
[32m+[m[32mimport { authRoutes } from "../../modules/auth";[m
[32m+[m[32mimport { userRoutes } from "../../modules/users";[m
[32m+[m
[32m+[m[32mimport { createTenantRoutes } from "../../presentation/routes/tenant.routes";[m
[32m+[m[32mimport { TenantController } from "../../presentation/controllers/tenant.controller";[m
[32m+[m[32mimport { tenantModule } from "../../infrastructure/composition/tenant.module";[m
[32m+[m
 [m
 const router = Router();[m
 [m
[31m-router.use("/api", apiRoutes);[m
 [m
[31m-router.use("/api/v1", protectedRoutes);[m
[31m-router.use("/api/v1", adminRoutes);[m
[31m-router.use("/api/v1", usersRoutes);[m
[32m+[m[32mconst tenantController =[m
[32m+[m[32m    new TenantController([m
[32m+[m[32m        tenantModule.createTenantUseCase,[m
[32m+[m
[32m+[m[32m        tenantModule.getTenantByIdUseCase,[m
[32m+[m
[32m+[m[32m        tenantModule.listTenantsUseCase,[m
[32m+[m[32m    );[m
[32m+[m
[32m+[m
[32m+[m[32mrouter.use("/", healthRoutes);[m
[32m+[m
[32m+[m[32mrouter.use("/auth", authRoutes);[m
[32m+[m
[32m+[m[32mrouter.use("/users", userRoutes);[m
[32m+[m
[32m+[m[32mrouter.use([m
[32m+[m[32m    "/tenants",[m
[32m+[m[32m    createTenantRoutes(tenantController),[m
[32m+[m[32m);[m
[32m+[m
 [m
 export default router;[m
\ No newline at end of file[m

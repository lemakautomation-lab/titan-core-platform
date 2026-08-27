import { DatabaseService } from "../database/database.service";

import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaSessionRepository } from "../repositories/session.repository";

import { LoginUseCase } from "../../application/use-cases/auth/login.use-case";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.use-case";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case";

import { auditLogModule } from "./audit-log.module";
import { authorizationModule } from "./authorization.module";

const databaseService =
    new DatabaseService();

export const userRepository =
    new PrismaUserRepository(
        databaseService,
    );

export const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );

export const authModule = {

    userRepository,

    sessionRepository,

    loginUseCase:
        new LoginUseCase(
            userRepository,
            sessionRepository,
            auditLogModule.auditLogService,
            auditLogModule.securityEventService,
            auditLogModule.securityAnalyticsService,
            authorizationModule.permissionResolutionService,
        ),

    refreshTokenUseCase:
        new RefreshTokenUseCase(
            sessionRepository,
            userRepository,
            auditLogModule.securityEventService,
        ),

    logoutUseCase:
        new LogoutUseCase(
            sessionRepository,
            auditLogModule.securityEventService,
        ),

};

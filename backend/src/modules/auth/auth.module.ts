import { DatabaseService } from "../../infrastructure/database/database.service";

import { PrismaUserRepository } from "../../infrastructure/repositories/user.repository";
import { PrismaSessionRepository } from "../../infrastructure/repositories/session.repository";

import { LoginUseCase } from "../../application/use-cases/auth/login.use-case";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.use-case";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case";

import { auditLogModule } from "../../infrastructure/composition/audit-log.module";


const databaseService =
    new DatabaseService();


const userRepository =
    new PrismaUserRepository(
        databaseService,
    );


const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );


export const authModule = {


    loginUseCase:

        new LoginUseCase(

            userRepository,

            sessionRepository,

            auditLogModule.auditLogService,

            auditLogModule.securityEventService,

            auditLogModule.securityAnalyticsService,

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

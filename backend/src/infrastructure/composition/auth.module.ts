import { DatabaseService } from "../database/database.service";

import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaSessionRepository } from "../repositories/session.repository";

import { LoginUseCase } from "../../application/use-cases/auth/login.use-case";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.use-case";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case";
import { UpdateMyPersonalDetailsUseCase } from "../../application/use-cases/update-my-personal-details.use-case";
import { PrismaPersonalDetailsUpdateTransaction } from "../transactions/personal-details-update.transaction";
import { UpdateMyAthleteGoalsUseCase } from "../../application/use-cases/update-my-athlete-goals.use-case";
import { PrismaAthleteGoalsUpdateTransaction } from "../transactions/athlete-goals-update.transaction";
import { CreateMyAthleteBodyMeasurementUseCase } from "../../application/use-cases/create-my-athlete-body-measurement.use-case";
import { PrismaAthleteBodyMeasurementCreateTransaction } from "../transactions/athlete-body-measurement-create.transaction";
import { GetMyAthleteOnboardingStatusUseCase } from "../../application/use-cases/get-my-athlete-onboarding-status.use-case";
import { PrismaAthleteOnboardingStatusQuery } from "../queries/athlete-onboarding-status.query";

import { auditLogModule } from "./audit-log.module";
import { authorizationModule } from "./authorization.module";

const databaseService =
    new DatabaseService();

const personalDetailsUpdateTransaction =
    new PrismaPersonalDetailsUpdateTransaction(
        databaseService,
    );

export const userRepository =
    new PrismaUserRepository(
        databaseService,
    );

const athleteGoalsUpdateTransaction =
    new PrismaAthleteGoalsUpdateTransaction(
        databaseService,
    );

const athleteBodyMeasurementCreateTransaction =
    new PrismaAthleteBodyMeasurementCreateTransaction(
        databaseService,
    );

const athleteOnboardingStatusQuery =
    new PrismaAthleteOnboardingStatusQuery(
        databaseService,
    );

export const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );

export const authModule = {

    userRepository,

    sessionRepository,

    updateMyPersonalDetailsUseCase:
        new UpdateMyPersonalDetailsUseCase(
            personalDetailsUpdateTransaction,
        ),
    updateMyAthleteGoalsUseCase:
        new UpdateMyAthleteGoalsUseCase(
            athleteGoalsUpdateTransaction,
        ),
    createMyAthleteBodyMeasurementUseCase:
        new CreateMyAthleteBodyMeasurementUseCase(
            athleteBodyMeasurementCreateTransaction,
        ),
    getMyAthleteOnboardingStatusUseCase:
        new GetMyAthleteOnboardingStatusUseCase(
            athleteOnboardingStatusQuery,
        ),
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

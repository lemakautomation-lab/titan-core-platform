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
import { UpdateMyAthleteBodyModelUseCase } from "../../application/use-cases/update-my-athlete-body-model.use-case";
import { GetMyAthletePerformanceBodyProfileUseCase } from "../../application/use-cases/get-my-athlete-performance-body-profile.use-case";
import { PrismaAthleteBodyModelUpdateTransaction } from "../transactions/athlete-body-model-update.transaction";
import { PrismaAthletePerformanceBodyProfileQuery } from "../queries/athlete-performance-body-profile.query";import { RegisterAthleteUseCase } from "../../application/use-cases/register-athlete.use-case";
import { PrismaAthleteRegistrationTransaction } from "../transactions/athlete-registration.transaction";
import { getConsumerTenantSlug } from "../../config/consumer-tenant.config";

import { RequestPasswordResetUseCase } from "../../application/use-cases/request-password-reset.use-case";
import { CompletePasswordResetUseCase } from "../../application/use-cases/complete-password-reset.use-case";
import { PrismaPasswordResetTransaction } from "../transactions/password-reset.transaction";
import { createResendPasswordResetEmailDelivery } from "../email/resend-password-reset-email-delivery";
import { UnavailablePasswordResetEmailDelivery } from "../email/unavailable-password-reset-email-delivery";
import {
    getPasswordResetFrontendUrl,
    getPasswordResetTokenTtlMinutes,
    getResendPasswordResetConfig,
} from "../../config/password-reset.config";
import { auditLogModule } from "./audit-log.module";
import { authorizationModule } from "./authorization.module";

const databaseService =
    new DatabaseService();

const athleteRegistrationTransaction =
    new PrismaAthleteRegistrationTransaction(
        databaseService,
    );

const passwordResetTransaction =
    new PrismaPasswordResetTransaction(
        databaseService,
    );

const resendPasswordResetConfig =
    getResendPasswordResetConfig();

const passwordResetEmailDelivery =
    resendPasswordResetConfig
        ? createResendPasswordResetEmailDelivery(
            resendPasswordResetConfig.apiKey,
            resendPasswordResetConfig.fromEmail,
        )
        : new UnavailablePasswordResetEmailDelivery();
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

const athleteBodyModelUpdateTransaction =
    new PrismaAthleteBodyModelUpdateTransaction(
        databaseService,
    );

const athletePerformanceBodyProfileQuery =
    new PrismaAthletePerformanceBodyProfileQuery(
        databaseService,
    );

export const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );

export const authModule = {

    userRepository,

    sessionRepository,

    requestPasswordResetUseCase:
        new RequestPasswordResetUseCase(
            passwordResetTransaction,
            passwordResetEmailDelivery,
            getConsumerTenantSlug(),
            getPasswordResetFrontendUrl(),
            getPasswordResetTokenTtlMinutes(),
        ),

    completePasswordResetUseCase:
        new CompletePasswordResetUseCase(
            passwordResetTransaction,
        ),
    registerAthleteUseCase:
        new RegisterAthleteUseCase(
            athleteRegistrationTransaction,
            getConsumerTenantSlug(),
        ),

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
    updateMyAthleteBodyModelUseCase:
        new UpdateMyAthleteBodyModelUseCase(
            athleteBodyModelUpdateTransaction,
        ),
    getMyAthletePerformanceBodyProfileUseCase:
        new GetMyAthletePerformanceBodyProfileUseCase(
            athletePerformanceBodyProfileQuery,
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

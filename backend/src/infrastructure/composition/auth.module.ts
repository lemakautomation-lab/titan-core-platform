import { GetMyTrainerAccessUseCase } from "../../application/use-cases/get-my-trainer-access.use-case";
import { ListMyTrainerClientsUseCase } from "../../application/use-cases/list-my-trainer-clients.use-case";
import { AddMyTrainerClientUseCase } from "../../application/use-cases/add-my-trainer-client.use-case";
import { RemoveMyTrainerClientUseCase } from "../../application/use-cases/remove-my-trainer-client.use-case";
import { GetMyTrainerProfileUseCase } from "../../application/use-cases/get-my-trainer-profile.use-case";
import { UpdateMyTrainerProfileUseCase } from "../../application/use-cases/update-my-trainer-profile.use-case";
import { PrismaTrainerProfileRepository } from "../repositories/trainer-profile.repository";
import { PrismaAthleteRelationshipRepository } from "../repositories/athlete-relationship.repository";
import { DatabaseService } from "../database/database.service";

import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaRecoveryTrackingRepository } from "../repositories/recovery-tracking/recovery-tracking.repository";
import { PrismaNutritionPlanRepository } from "../repositories/nutrition-plan/nutrition-plan.repository";
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
import { GetMyRelevantContextUseCase } from "../../application/use-cases/get-my-relevant-context.use-case";
import { GetMyActionableInsightsUseCase } from "../../application/use-cases/get-my-actionable-insights.use-case";
import { ListRecentRecoveryTrackingUseCase } from "../../application/use-cases/list-recent-recovery-tracking.use-case";
import { PrismaAthleteBodyModelUpdateTransaction } from "../transactions/athlete-body-model-update.transaction";
import { PrismaAthletePerformanceBodyProfileQuery } from "../queries/athlete-performance-body-profile.query";import { RegisterAthleteUseCase } from "../../application/use-cases/register-athlete.use-case";
import { PrismaAthleteRegistrationTransaction } from "../transactions/athlete-registration.transaction";
import { RegisterTrainerUseCase } from "../../application/use-cases/register-trainer.use-case";
import { PrismaTrainerRegistrationTransaction } from "../transactions/trainer-registration.transaction";
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
import { RequestAccountAssistanceUseCase } from "../../application/use-cases/request-account-assistance.use-case";
import { PrismaAccountAssistanceTransaction } from "../transactions/account-assistance.transaction";
import { auditLogModule } from "./audit-log.module";
import { authorizationModule } from "./authorization.module";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";

import { PrismaPaymentRepository } from "../repositories/payment.repository";
import { PrismaUserTypeEntitlementRepository } from "../repositories/user-type-entitlement.repository";
const databaseService =
    new DatabaseService();

const athleteRegistrationTransaction =
    new PrismaAthleteRegistrationTransaction(
        databaseService,
    );

const accountAssistanceTransaction =
    new PrismaAccountAssistanceTransaction(
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

const paymentRepository =
    new PrismaPaymentRepository(
        databaseService,
    );

const userTypeEntitlementRepository =
    new PrismaUserTypeEntitlementRepository(
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

const athleteRepository =
    new PrismaAthleteRepository(databaseService);

const recoveryTrackingRepository =
    new PrismaRecoveryTrackingRepository(databaseService);

const nutritionPlanRepository =
    new PrismaNutritionPlanRepository(databaseService);

const listRecentRecoveryTrackingUseCase =
    new ListRecentRecoveryTrackingUseCase(
        recoveryTrackingRepository,
        athleteRepository,
    );

const performanceMetricRepository =
    new PrismaPerformanceMetricRepository(databaseService);
const performanceMeasurementRepository =
    new PrismaPerformanceMeasurementRepository(databaseService);

const athletePerformanceBodyProfileQuery =
    new PrismaAthletePerformanceBodyProfileQuery(
        databaseService,
    );

export const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );

const trainerRegistrationTransaction =
    new PrismaTrainerRegistrationTransaction(
        databaseService,
    );
const trainerProfileRepository =
    new PrismaTrainerProfileRepository(
        databaseService,
    );const athleteRelationshipRepository =
    new PrismaAthleteRelationshipRepository(
        databaseService,
    );
export const authModule = {

    userRepository,

    sessionRepository,

    requestAccountAssistanceUseCase:
        new RequestAccountAssistanceUseCase(
            accountAssistanceTransaction,
            getConsumerTenantSlug(),
        ),
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
    registerTrainerUseCase:
        new RegisterTrainerUseCase(
            trainerRegistrationTransaction,
            getConsumerTenantSlug(),
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
    getMyActionableInsightsUseCase:
        new GetMyActionableInsightsUseCase(
            athleteRepository,
            performanceMetricRepository,
            performanceMeasurementRepository
        ),
    getMyRelevantContextUseCase:
        new GetMyRelevantContextUseCase(
            athleteRepository,
            listRecentRecoveryTrackingUseCase,
            nutritionPlanRepository,
            new GetMyAthletePerformanceBodyProfileUseCase(
                athletePerformanceBodyProfileQuery,
            ),
        ),
    getMyTrainerAccessUseCase:
        new GetMyTrainerAccessUseCase(
            userRepository,
            userTypeEntitlementRepository,
            paymentRepository,
        ),    listMyTrainerClientsUseCase:
        new ListMyTrainerClientsUseCase(
            athleteRelationshipRepository,
            athleteRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
        ),
    addMyTrainerClientUseCase:
        new AddMyTrainerClientUseCase(
            athleteRelationshipRepository,
            athleteRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
        ),
    removeMyTrainerClientUseCase:
        new RemoveMyTrainerClientUseCase(
            athleteRelationshipRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
        ),    getMyTrainerProfileUseCase:
        new GetMyTrainerProfileUseCase(
            trainerProfileRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
        ),
    updateMyTrainerProfileUseCase:
        new UpdateMyTrainerProfileUseCase(
            trainerProfileRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
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

import { AthleteOnboardingStatusDto } from "../../application/dto/athlete/athlete-onboarding-status.dto";
import {
    AthleteOnboardingStatusQuery,
    AthleteOnboardingStatusQueryInput,
} from "../../application/ports/athlete-onboarding-status.query";
import { AthleteOnboardingReadiness } from "../../domain/services/athlete-onboarding-readiness.service";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteOnboardingStatusQuery
implements AthleteOnboardingStatusQuery {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input:
            Readonly<AthleteOnboardingStatusQueryInput>,
    ): Promise<AthleteOnboardingStatusDto> {
        return this.database.transaction(
            async (transaction) => {
                const user =
                    await transaction.user.findFirst({
                        where: {
                            id: input.userId,
                            tenantId: input.tenantId,
                        },
                        select: {
                            email: true,
                            contactNumber: true,
                            selectedUserType: true,
                            status: true,
                        },
                    });

                if (!user) {
                    throw new Error("User not found.");
                }

                if (user.status !== "ACTIVE") {
                    throw new Error(
                        "User account is not active.",
                    );
                }

                const athlete =
                    await transaction.athlete.findFirst({
                        where: {
                            userId: input.userId,
                            tenantId: input.tenantId,
                            status: "ACTIVE",
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            countryCode: true,
                            dateOfBirth: true,
                        },
                    });

                const entitlement =
                    await transaction
                        .userTypeEntitlement
                        .findFirst({
                            where: {
                                userId: input.userId,
                                tenantId: input.tenantId,
                                userType: "ATHLETE",
                                status: "ACTIVE",
                            },
                            select: {
                                id: true,
                            },
                        });

                let goalCount = 0;
                let primaryGoalCount = 0;
                let measurementCount = 0;

                if (athlete) {
                    [
                        goalCount,
                        primaryGoalCount,
                        measurementCount,
                    ] = await Promise.all([
                        transaction.athleteGoal.count({
                            where: {
                                tenantId:
                                    input.tenantId,
                                athleteId:
                                    athlete.id,
                            },
                        }),
                        transaction.athleteGoal.count({
                            where: {
                                tenantId:
                                    input.tenantId,
                                athleteId:
                                    athlete.id,
                                isPrimary: true,
                            },
                        }),
                        transaction
                            .athleteBodyMeasurement
                            .count({
                                where: {
                                    tenantId:
                                        input.tenantId,
                                    athleteId:
                                        athlete.id,
                                },
                            }),
                    ]);
                }

                return AthleteOnboardingReadiness
                    .evaluate({
                        selectedAthleteType:
                            user.selectedUserType ===
                            "ATHLETE",
                        activeAthleteEntitlement:
                            entitlement !== null,
                        athleteProfile:
                            athlete !== null,
                        firstName:
                            Boolean(
                                athlete?.firstName
                                    .trim(),
                            ),
                        surname:
                            Boolean(
                                athlete?.lastName
                                    .trim(),
                            ),
                        email:
                            Boolean(user.email.trim()),
                        contactNumber:
                            Boolean(
                                user.contactNumber
                                    ?.trim(),
                            ),
                        country:
                            Boolean(
                                athlete?.countryCode
                                    ?.trim(),
                            ),
                        dateOfBirth:
                            athlete?.dateOfBirth !==
                            null &&
                            athlete?.dateOfBirth !==
                            undefined,
                        athleteGoals:
                            goalCount >= 1 &&
                            primaryGoalCount === 1,
                        bodyMeasurement:
                            measurementCount >= 1,
                    });
            },
        );
    }
}
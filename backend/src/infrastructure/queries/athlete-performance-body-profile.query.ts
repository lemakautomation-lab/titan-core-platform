import { AthletePerformanceBodyProfileDto } from "../../application/dto/athlete/athlete-performance-body-profile.dto";
import {
    AthletePerformanceBodyProfileQuery,
    AthletePerformanceBodyProfileQueryInput,
} from "../../application/ports/athlete-performance-body-profile.query";
import { validatePerformanceBodyModelType } from "../../domain/enums/performance-body-model-type.enum";
import { DatabaseService } from "../database/database.service";

const MAX_MEASUREMENT_HISTORY = 100;

export class PrismaAthletePerformanceBodyProfileQuery
implements AthletePerformanceBodyProfileQuery {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input:
            Readonly<AthletePerformanceBodyProfileQueryInput>,
    ): Promise<AthletePerformanceBodyProfileDto> {
        return this.database.transaction(
            async (transaction) => {
                const user =
                    await transaction.user.findFirst({
                        where: {
                            id: input.userId,
                            tenantId: input.tenantId,
                        },
                        select: {
                            id: true,
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
                        },
                        select: {
                            id: true,
                            tenantId: true,
                            status: true,
                            bodyModelType: true,
                        },
                    });

                if (!athlete) {
                    throw new Error(
                        "Athlete profile not found.",
                    );
                }

                if (athlete.status !== "ACTIVE") {
                    throw new Error(
                        "Athlete profile is not active.",
                    );
                }

                const measurements =
                    await transaction
                        .athleteBodyMeasurement
                        .findMany({
                            where: {
                                tenantId:
                                    input.tenantId,
                                athleteId:
                                    athlete.id,
                            },
                            orderBy: [
                                {
                                    recordedAt: "asc",
                                },
                                {
                                    id: "asc",
                                },
                            ],
                            take:
                                MAX_MEASUREMENT_HISTORY,
                        });

                return {
                    athleteId: athlete.id,
                    tenantId: athlete.tenantId,
                    modelType:
                        athlete.bodyModelType === null
                            ? null
                            : validatePerformanceBodyModelType(
                                athlete.bodyModelType,
                            ),
                    measurements:
                        measurements.map(
                            (measurement) => ({
                                id: measurement.id,
                                heightCm:
                                    measurement.heightCm
                                        .toNumber(),
                                weightKg:
                                    measurement.weightKg
                                        .toNumber(),
                                bmi:
                                    measurement.bmi
                                        .toNumber(),
                                bodyFatPercentage:
                                    measurement
                                        .bodyFatPercentage
                                        ?.toNumber() ??
                                    null,
                                bodyFatMethod: measurement.bodyFatMethod,
                                bodyFatSource: measurement.bodyFatSource,
                                recordedAt:
                                    measurement.recordedAt
                                        .toISOString(),
                            }),
                        ),
                };
            },
        );
    }
}
import { AthleteBodyMeasurementDto } from "../../application/dto/athlete/athlete-body-measurement.dto";
import {
    AthleteBodyMeasurementCreateInput,
    AthleteBodyMeasurementCreateTransaction,
} from "../../application/ports/athlete-body-measurement-create.transaction";
import { AthleteBodyMeasurement } from "../../domain/entities/athlete-body-measurement.entity";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteBodyMeasurementCreateTransaction
implements AthleteBodyMeasurementCreateTransaction {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input: Readonly<AthleteBodyMeasurementCreateInput>,
    ): Promise<AthleteBodyMeasurementDto> {
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
                        },
                    });

                if (!user) {
                    throw new Error("User not found.");
                }

                const athlete =
                    await transaction.athlete.findFirst({
                        where: {
                            userId: input.userId,
                            tenantId: input.tenantId,
                        },
                        select: {
                            id: true,
                            status: true,
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

                const measurement =
                    AthleteBodyMeasurement.create({
                        tenantId: input.tenantId,
                        athleteId: athlete.id,
                        heightCm: input.heightCm,
                        weightKg: input.weightKg,
                        bodyFatPercentage:
                            input.bodyFatPercentage,
                        recordedAt: input.recordedAt,
                    });

                const persisted =
                    await transaction
                        .athleteBodyMeasurement
                        .create({
                            data: {
                                id: measurement.id,
                                tenantId:
                                    measurement.tenantId,
                                athleteId:
                                    measurement.athleteId,
                                heightCm:
                                    measurement.heightCm,
                                weightKg:
                                    measurement.weightKg,
                                bmi: measurement.bmi,
                                bodyFatPercentage:
                                    measurement
                                        .bodyFatPercentage,
                                recordedAt:
                                    measurement.recordedAt,
                                createdAt:
                                    measurement.createdAt,
                            },
                        });

                return {
                    id: persisted.id,
                    athleteId: persisted.athleteId,
                    tenantId: persisted.tenantId,
                    heightCm:
                        persisted.heightCm.toNumber(),
                    weightKg:
                        persisted.weightKg.toNumber(),
                    bmi: persisted.bmi.toNumber(),
                    bodyFatPercentage:
                        persisted.bodyFatPercentage
                            ?.toNumber() ?? null,
                    recordedAt:
                        persisted.recordedAt
                            .toISOString(),
                    createdAt:
                        persisted.createdAt
                            .toISOString(),
                };
            },
        );
    }
}
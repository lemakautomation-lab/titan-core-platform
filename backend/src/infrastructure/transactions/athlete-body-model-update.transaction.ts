import { AthleteBodyModelDto } from "../../application/dto/athlete/athlete-body-model.dto";
import {
    AthleteBodyModelUpdateInput,
    AthleteBodyModelUpdateTransaction,
} from "../../application/ports/athlete-body-model-update.transaction";
import { validatePerformanceBodyModelType } from "../../domain/enums/performance-body-model-type.enum";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteBodyModelUpdateTransaction
implements AthleteBodyModelUpdateTransaction {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input: Readonly<AthleteBodyModelUpdateInput>,
    ): Promise<AthleteBodyModelDto> {
        const modelType =
            validatePerformanceBodyModelType(
                input.modelType,
            );

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

                const updated =
                    await transaction.athlete.update({
                        where: {
                            id: athlete.id,
                        },
                        data: {
                            bodyModelType: modelType,
                        },
                        select: {
                            id: true,
                            tenantId: true,
                            bodyModelType: true,
                        },
                    });

                if (!updated.bodyModelType) {
                    throw new Error(
                        "Performance body model could not be updated.",
                    );
                }

                return {
                    athleteId: updated.id,
                    tenantId: updated.tenantId,
                    modelType:
                        validatePerformanceBodyModelType(
                            updated.bodyModelType,
                        ),
                };
            },
        );
    }
}
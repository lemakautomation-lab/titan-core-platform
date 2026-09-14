import { AthleteGoalsDto } from "../../application/dto/athlete/athlete-goals.dto";
import {
    AthleteGoalsUpdateInput,
    AthleteGoalsUpdateTransaction,
} from "../../application/ports/athlete-goals-update.transaction";
import { AthleteGoal } from "../../domain/entities/athlete-goal.entity";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteGoalsUpdateTransaction
implements AthleteGoalsUpdateTransaction {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input: Readonly<AthleteGoalsUpdateInput>,
    ): Promise<AthleteGoalsDto> {
        const selection = AthleteGoal.validateSelection(
            input.primaryGoal,
            input.secondaryGoals,
        );

        return this.database.transaction(
            async (transaction) => {
                const user = await transaction.user.findFirst({
                    where: {
                        id: input.userId,
                        tenantId: input.tenantId,
                    },
                    select: { id: true },
                });

                if (!user) {
                    throw new Error("User not found.");
                }

                const athlete = await transaction.athlete.findFirst({
                    where: {
                        userId: input.userId,
                        tenantId: input.tenantId,
                    },
                    select: { id: true, status: true },
                });

                if (!athlete) {
                    throw new Error("Athlete profile not found.");
                }

                if (athlete.status !== "ACTIVE") {
                    throw new Error("Athlete profile is not active.");
                }

                const goals = [
                    AthleteGoal.create(
                        input.tenantId,
                        athlete.id,
                        selection.primaryGoal,
                        true,
                    ),
                    ...selection.secondaryGoals.map(
                        (classification) => AthleteGoal.create(
                            input.tenantId,
                            athlete.id,
                            classification,
                            false,
                        ),
                    ),
                ];

                await transaction.athleteGoal.deleteMany({
                    where: {
                        tenantId: input.tenantId,
                        athleteId: athlete.id,
                    },
                });

                await transaction.athleteGoal.createMany({
                    data: goals.map((goal) => ({
                        id: goal.id,
                        tenantId: goal.tenantId,
                        athleteId: goal.athleteId,
                        classification: goal.classification,
                        isPrimary: goal.isPrimary,
                        createdAt: goal.createdAt,
                        updatedAt: goal.updatedAt,
                    })),
                });

                const persisted = await transaction.athleteGoal.findMany({
                    where: {
                        tenantId: input.tenantId,
                        athleteId: athlete.id,
                    },
                });

                const primary = persisted.find(
                    (goal) => goal.isPrimary,
                );

                if (!primary) {
                    throw new Error("Athlete goals could not be updated.");
                }

                return {
                    athleteId: athlete.id,
                    tenantId: input.tenantId,
                    ...AthleteGoal.validateSelection(
                        primary.classification,
                        persisted
                            .filter((goal) => !goal.isPrimary)
                            .map((goal) => goal.classification),
                    ),
                };
            },
        );
    }
}

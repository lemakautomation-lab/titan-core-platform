import { UpdateMyAthleteGoalsCommand } from "../commands/update-my-athlete-goals.command";
import { Result } from "../common/result";
import { AthleteGoalsDto } from "../dto/athlete/athlete-goals.dto";
import { AthleteGoalsUpdateTransaction } from "../ports/athlete-goals-update.transaction";

export class UpdateMyAthleteGoalsUseCase {
    constructor(
        private readonly transaction:
            AthleteGoalsUpdateTransaction,
    ) {}

    async execute(
        command: UpdateMyAthleteGoalsCommand,
    ): Promise<Result<AthleteGoalsDto>> {
        try {
            return Result.success(
                await this.transaction.execute(
                    Object.freeze({
                        userId: command.userId,
                        tenantId: command.tenantId,
                        primaryGoal: command.primaryGoal,
                        secondaryGoals: command.secondaryGoals,
                    }),
                ),
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Athlete goals could not be updated.",
            );
        }
    }
}

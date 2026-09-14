import { UpdateMyAthleteBodyModelCommand } from "../commands/update-my-athlete-body-model.command";
import { Result } from "../common/result";
import { AthleteBodyModelDto } from "../dto/athlete/athlete-body-model.dto";
import { AthleteBodyModelUpdateTransaction } from "../ports/athlete-body-model-update.transaction";

export class UpdateMyAthleteBodyModelUseCase {
    constructor(
        private readonly transaction:
            AthleteBodyModelUpdateTransaction,
    ) {}

    async execute(
        command:
            UpdateMyAthleteBodyModelCommand,
    ): Promise<Result<AthleteBodyModelDto>> {
        try {
            return Result.success(
                await this.transaction.execute(
                    Object.freeze({
                        userId: command.userId,
                        tenantId: command.tenantId,
                        modelType: command.modelType,
                    }),
                ),
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Performance body model could not be updated.",
            );
        }
    }
}
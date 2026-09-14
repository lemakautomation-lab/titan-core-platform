import { CreateMyAthleteBodyMeasurementCommand } from "../commands/create-my-athlete-body-measurement.command";
import { Result } from "../common/result";
import { AthleteBodyMeasurementDto } from "../dto/athlete/athlete-body-measurement.dto";
import { AthleteBodyMeasurementCreateTransaction } from "../ports/athlete-body-measurement-create.transaction";

export class CreateMyAthleteBodyMeasurementUseCase {
    constructor(
        private readonly transaction:
            AthleteBodyMeasurementCreateTransaction,
    ) {}

    async execute(
        command:
            CreateMyAthleteBodyMeasurementCommand,
    ): Promise<Result<AthleteBodyMeasurementDto>> {
        try {
            return Result.success(
                await this.transaction.execute(
                    Object.freeze({
                        userId: command.userId,
                        tenantId: command.tenantId,
                        heightCm: command.heightCm,
                        weightKg: command.weightKg,
                        bodyFatPercentage:
                            command.bodyFatPercentage,
                        recordedAt: command.recordedAt,
                    }),
                ),
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Body measurement could not be recorded.",
            );
        }
    }
}
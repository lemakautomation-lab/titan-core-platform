import { RegisterTrainerCommand } from "../commands/register-trainer.command";
import { Result } from "../common/result";
import { TrainerRegistrationDto } from "../dto/trainer/trainer-registration.dto";
import { TrainerRegistrationTransaction } from "../ports/trainer-registration.transaction";

export class RegisterTrainerUseCase {
    constructor(
        private readonly transaction:
            TrainerRegistrationTransaction,
        private readonly consumerTenantSlug: string,
    ) {}

    async execute(
        command: RegisterTrainerCommand,
    ): Promise<Result<TrainerRegistrationDto>> {
        try {
            const result =
                await this.transaction.execute(
                    Object.freeze({
                        consumerTenantSlug:
                            this.consumerTenantSlug,
                        firstName:
                            command.firstName,
                        lastName:
                            command.lastName,
                        email:
                            command.email,
                        password:
                            command.password,
                    }),
                );

            return Result.success(result);
        } catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Trainer registration failed.",
            );
        }
    }
}

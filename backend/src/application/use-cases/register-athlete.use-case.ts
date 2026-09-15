import { RegisterAthleteCommand } from "../commands/register-athlete.command";
import { Result } from "../common/result";
import { AthleteRegistrationDto } from "../dto/athlete/athlete-registration.dto";
import { AthleteRegistrationTransaction } from "../ports/athlete-registration.transaction";

export class RegisterAthleteUseCase {
    constructor(
        private readonly transaction:
            AthleteRegistrationTransaction,
        private readonly consumerTenantSlug: string,
    ) {}

    async execute(
        command: RegisterAthleteCommand,
    ): Promise<Result<AthleteRegistrationDto>> {
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
                        countryCode:
                            command.countryCode,
                        dateOfBirth:
                            command.dateOfBirth,
                    }),
                );

            return Result.success(result);
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Athlete registration failed.",
            );
        }
    }
}
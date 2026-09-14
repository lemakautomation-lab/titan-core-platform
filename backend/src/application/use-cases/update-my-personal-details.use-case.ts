import { UpdateMyPersonalDetailsCommand } from "../commands/update-my-personal-details.command";
import { Result } from "../common/result";
import { PersonalDetailsDto } from "../dto/user/personal-details.dto";
import { PersonalDetailsUpdateTransaction } from "../ports/personal-details-update.transaction";

export class UpdateMyPersonalDetailsUseCase {

    constructor(
        private readonly transaction:
            PersonalDetailsUpdateTransaction,
    ) {}

    async execute(
        command: UpdateMyPersonalDetailsCommand,
    ): Promise<Result<PersonalDetailsDto>> {

        try {
            const updated =
                await this.transaction.execute(
                    Object.freeze({
                        userId: command.userId,
                        tenantId: command.tenantId,
                        firstName: command.firstName,
                        lastName: command.lastName,
                        email: command.email,
                        contactNumber:
                            command.contactNumber,
                        countryCode:
                            command.countryCode,
                        dateOfBirth:
                            command.dateOfBirth,
                    }),
                );

            return Result.success(
                updated,
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Personal details could not be updated.",
            );
        }
    }

}

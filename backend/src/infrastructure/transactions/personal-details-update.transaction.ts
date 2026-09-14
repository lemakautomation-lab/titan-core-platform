import { PersonalDetailsDto } from "../../application/dto/user/personal-details.dto";
import {
    PersonalDetailsUpdateInput,
    PersonalDetailsUpdateTransaction,
} from "../../application/ports/personal-details-update.transaction";
import { AthleteMapper } from "../mappers/athlete.mapper";
import { UserMapper } from "../mappers/user.mapper";
import { DatabaseService } from "../database/database.service";

export class PrismaPersonalDetailsUpdateTransaction
implements PersonalDetailsUpdateTransaction {

    constructor(
        private readonly database:
            DatabaseService,
    ) {}

    async execute(
        input: Readonly<PersonalDetailsUpdateInput>,
    ): Promise<PersonalDetailsDto> {

        if (
            input.dateOfBirth !== null &&
            (
                Number.isNaN(
                    input.dateOfBirth.getTime(),
                ) ||
                input.dateOfBirth >
                    new Date()
            )
        ) {
            throw new Error(
                "Date of birth is invalid.",
            );
        }

        return this.database.transaction(
            async (transaction) => {

                const userRecord =
                    await transaction.user.findFirst({
                        where: {
                            id: input.userId,
                            tenantId: input.tenantId,
                        },
                    });

                if (!userRecord) {
                    throw new Error(
                        "User not found.",
                    );
                }

                const athleteRecord =
                    await transaction.athlete.findFirst({
                        where: {
                            userId: input.userId,
                            tenantId: input.tenantId,
                        },
                    });

                if (!athleteRecord) {
                    throw new Error(
                        "Athlete profile not found.",
                    );
                }

                const duplicate =
                    await transaction.user.findFirst({
                        where: {
                            tenantId: input.tenantId,
                            email: input.email
                                .trim()
                                .toLowerCase(),
                            id: {
                                not: input.userId,
                            },
                        },
                        select: {
                            id: true,
                        },
                    });

                if (duplicate) {
                    throw new Error(
                        "Email already exists for this tenant.",
                    );
                }

                const user =
                    UserMapper.toDomain(
                        userRecord,
                    );

                const athlete =
                    AthleteMapper.toDomain(
                        athleteRecord,
                    );

                athlete.updateProfile(
                    athlete.organisationId,
                    athlete.userId,
                    input.firstName,
                    input.lastName,
                    input.dateOfBirth,
                );

                athlete.updateCountry(
                    input.countryCode,
                );

                user.updateProfile(
                    user.organisationId,
                    input.email,
                    athlete.firstName,
                    athlete.lastName,
                    input.contactNumber,
                );

                const userUpdate =
                    await transaction.user.updateMany({
                        where: {
                            id: user.id,
                            tenantId: input.tenantId,
                        },
                        data: {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            contactNumber:
                                user.contactNumber,
                            updatedAt: user.updatedAt,
                        },
                    });

                if (userUpdate.count !== 1) {
                    throw new Error(
                        "User profile update failed.",
                    );
                }

                const athleteUpdate =
                    await transaction.athlete.updateMany({
                        where: {
                            id: athlete.id,
                            tenantId: input.tenantId,
                            userId: input.userId,
                        },
                        data: {
                            firstName:
                                athlete.firstName,
                            lastName:
                                athlete.lastName,
                            dateOfBirth:
                                athlete.dateOfBirth,
                            countryCode:
                                athlete.countryCode,
                            updatedAt:
                                athlete.updatedAt,
                        },
                    });

                if (athleteUpdate.count !== 1) {
                    throw new Error(
                        "Athlete profile update failed.",
                    );
                }

                return {
                    userId: user.id,
                    athleteId: athlete.id,
                    tenantId: input.tenantId,
                    firstName:
                        athlete.firstName,
                    lastName:
                        athlete.lastName,
                    email: user.email,
                    contactNumber:
                        user.contactNumber,
                    countryCode:
                        athlete.countryCode!,
                    dateOfBirth:
                        athlete.dateOfBirth,
                };
            },
        );
    }

}

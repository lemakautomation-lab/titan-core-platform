import { AthleteRegistrationDto } from "../../application/dto/athlete/athlete-registration.dto";
import {
    AthleteRegistrationInput,
    AthleteRegistrationTransaction,
} from "../../application/ports/athlete-registration.transaction";
import { Athlete } from "../../domain/entities/athlete.entity";
import { AthleteDigitalTwin } from "../../domain/entities/athlete-digital-twin.entity";
import { User } from "../../domain/entities/user.entity";
import { passwordSecurity } from "../../security/bcrypt";
import { ValidationException } from "../../shared/exceptions/validation.exception";
import { UserValidator } from "../../shared/validation/validators/user.validator";
import { DatabaseService } from "../database/database.service";

export class PrismaAthleteRegistrationTransaction
implements AthleteRegistrationTransaction {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input: Readonly<AthleteRegistrationInput>,
    ): Promise<AthleteRegistrationDto> {
        const normalizedEmail =
            User.normalizeEmail(input.email);

        if (
            !(input.dateOfBirth instanceof Date) ||
            Number.isNaN(input.dateOfBirth.getTime()) ||
            input.dateOfBirth.getTime() >
                Date.now()
        ) {
            throw new Error(
                "Athlete date of birth must be a valid, non-future date.",
            );
        }

        const validatedAthlete =
            Athlete.create(
                "validation-tenant",
                null,
                "validation-user",
                input.firstName,
                input.lastName,
                input.dateOfBirth,
                input.countryCode,
            );

        const validation =
            new UserValidator().validate({
                tenantId:
                    input.consumerTenantSlug,
                email:
                    normalizedEmail,
                password:
                    input.password,
            });

        if (!validation.isValid) {
            throw new ValidationException(
                validation.errors,
            );
        }

        const passwordHash =
            await passwordSecurity.hash(
                input.password,
            );

        try {
            return await this.database.transaction(
                async (transaction) => {
                    const tenant =
                        await transaction.tenant
                            .findUnique({
                                where: {
                                    slug:
                                        input
                                            .consumerTenantSlug,
                                },
                                select: {
                                    id: true,
                                    status: true,
                                },
                            });

                    if (
                        !tenant ||
                        tenant.status !== "ACTIVE"
                    ) {
                        throw new Error(
                            "Athlete registration is unavailable.",
                        );
                    }

                    const existingUser =
                        await transaction.user
                            .findUnique({
                                where: {
                                    tenantId_email: {
                                        tenantId:
                                            tenant.id,
                                        email:
                                            normalizedEmail,
                                    },
                                },
                                select: {
                                    id: true,
                                },
                            });

                    if (existingUser) {
                        throw new Error(
                            "Email already exists for this tenant.",
                        );
                    }

                    const user =
                        User.create(
                            tenant.id,
                            null,
                            normalizedEmail,
                            passwordHash,
                            validatedAthlete
                                .firstName,
                            validatedAthlete
                                .lastName,
                            null,
                            "ATHLETE",
                        );

                    const athlete =
                        Athlete.create(
                            tenant.id,
                            null,
                            user.id,
                            validatedAthlete
                                .firstName,
                            validatedAthlete
                                .lastName,
                            input.dateOfBirth,
                            validatedAthlete
                                .countryCode,
                        );

                    const digitalTwin =
                        AthleteDigitalTwin.create(
                            tenant.id,
                            athlete.id,
                        );

                    await transaction.user.create({
                        data: {
                            id: user.id,
                            tenantId:
                                user.tenantId,
                            organisationId: null,
                            email: user.email,
                            passwordHash:
                                user.passwordHash,
                            firstName:
                                user.firstName,
                            lastName:
                                user.lastName,
                            contactNumber: null,
                            selectedUserType:
                                "ATHLETE",
                            status: "ACTIVE",
                            createdAt:
                                user.createdAt,
                            updatedAt:
                                user.updatedAt,
                        },
                    });

                    await transaction.athlete.create({
                        data: {
                            id: athlete.id,
                            tenantId:
                                athlete.tenantId,
                            organisationId: null,
                            userId: user.id,
                            firstName:
                                athlete.firstName,
                            lastName:
                                athlete.lastName,
                            dateOfBirth:
                                athlete.dateOfBirth,
                            countryCode:
                                athlete.countryCode,
                            status: "ACTIVE",
                            bodyModelType: null,
                            createdAt:
                                athlete.createdAt,
                            updatedAt:
                                athlete.updatedAt,
                        },
                    });

                    await transaction
                        .athleteDigitalTwin
                        .create({
                            data: {
                                id:
                                    digitalTwin.id,
                                tenantId:
                                    digitalTwin
                                        .tenantId,
                                athleteId:
                                    digitalTwin
                                        .athleteId,
                                status: "ACTIVE",
                                createdAt:
                                    digitalTwin
                                        .createdAt,
                                updatedAt:
                                    digitalTwin
                                        .updatedAt,
                            },
                        });

                    return {
                        userId: user.id,
                        athleteId: athlete.id,
                        digitalTwinId:
                            digitalTwin.id,
                        tenantId: tenant.id,
                        email: user.email,
                    };
                },
            );
        }
        catch (error) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "P2002"
            ) {
                throw new Error(
                    "Email already exists for this tenant.",
                    {
                        cause: error,
                    },
                );
            }

            throw error;
        }
    }
}
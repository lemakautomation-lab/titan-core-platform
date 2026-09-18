import { TrainerRegistrationDto } from "../../application/dto/trainer/trainer-registration.dto";
import {
    TrainerRegistrationInput,
    TrainerRegistrationTransaction,
} from "../../application/ports/trainer-registration.transaction";
import { User } from "../../domain/entities/user.entity";
import { passwordSecurity } from "../../security/bcrypt";
import { ValidationException } from "../../shared/exceptions/validation.exception";
import { UserValidator } from "../../shared/validation/validators/user.validator";
import { DatabaseService } from "../database/database.service";

export class PrismaTrainerRegistrationTransaction
implements TrainerRegistrationTransaction {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input: Readonly<TrainerRegistrationInput>,
    ): Promise<TrainerRegistrationDto> {
        const normalizedEmail =
            User.normalizeEmail(input.email);

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
                            "Trainer registration is unavailable.",
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
                            input.firstName,
                            input.lastName,
                            null,
                            "TRAINER",
                        );

                    await transaction.user.create({
                        data: {
                            id: user.id,
                            tenantId:
                                user.tenantId,
                            organisationId: null,
                            email:
                                user.email,
                            passwordHash:
                                user.passwordHash,
                            firstName:
                                user.firstName,
                            lastName:
                                user.lastName,
                            contactNumber: null,
                            selectedUserType:
                                "TRAINER",
                            status: "ACTIVE",
                            createdAt:
                                user.createdAt,
                            updatedAt:
                                user.updatedAt,
                        },
                    });

                    return {
                        userId: user.id,
                        tenantId: tenant.id,
                        email: user.email,
                    };
                },
            );
        } catch (error) {
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

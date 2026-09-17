import { Result } from "../common/result";
import { OnboardingUserType } from "../../domain/enums/onboarding-user-type.enum";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { UserRepository } from "../../domain/repositories/user.repository";
import { UserTypeEntitlementRepository } from "../../domain/repositories/user-type-entitlement.repository";

export interface GetMyTrainerAccessQuery {
    userId: string;
    tenantId: string;
}

export interface TrainerAccessDto {
    accessGranted: boolean;
    reason:
        | "GRANTED"
        | "TRAINER_TYPE_REQUIRED"
        | "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED";
}

export class GetMyTrainerAccessUseCase {

    constructor(
        private readonly userRepository:
            UserRepository,
        private readonly entitlementRepository:
            UserTypeEntitlementRepository,
        private readonly paymentRepository:
            PaymentRepository,
    ) {}

    async execute(
        input: Readonly<GetMyTrainerAccessQuery>,
    ): Promise<Result<TrainerAccessDto>> {

        try {
            const user =
                await this.userRepository.findById(
                    input.userId,
                );

            if (
                !user ||
                user.tenantId !== input.tenantId
            ) {
                return Result.failure(
                    "User not found.",
                );
            }

            if (!user.isActive()) {
                return Result.failure(
                    "User account is not active.",
                );
            }

            if (
                user.selectedUserType !==
                OnboardingUserType.TRAINER
            ) {
                return Result.success({
                    accessGranted: false,
                    reason:
                        "TRAINER_TYPE_REQUIRED",
                });
            }

            const now = new Date();

            const entitlements =
                await this.entitlementRepository
                    .findActive(
                        input.userId,
                        OnboardingUserType.TRAINER,
                        input.tenantId,
                        now,
                    );

            for (const entitlement of entitlements) {
                const payment =
                    await this.paymentRepository
                        .findById(
                            entitlement.paymentId,
                            input.tenantId,
                        );

                if (
                    payment &&
                    entitlement.isActive(
                        payment,
                        now,
                    )
                ) {
                    return Result.success({
                        accessGranted: true,
                        reason: "GRANTED",
                    });
                }
            }

            return Result.success({
                accessGranted: false,
                reason:
                    "ACTIVE_TRAINER_ENTITLEMENT_REQUIRED",
            });
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Trainer access could not be determined.",
            );
        }
    }
}

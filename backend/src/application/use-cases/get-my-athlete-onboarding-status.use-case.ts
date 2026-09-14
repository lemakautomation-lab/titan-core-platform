import { Result } from "../common/result";
import { AthleteOnboardingStatusDto } from "../dto/athlete/athlete-onboarding-status.dto";
import { AthleteOnboardingStatusQuery } from "../ports/athlete-onboarding-status.query";

export interface GetMyAthleteOnboardingStatusQuery {
    userId: string;
    tenantId: string;
}

export class GetMyAthleteOnboardingStatusUseCase {
    constructor(
        private readonly query:
            AthleteOnboardingStatusQuery,
    ) {}

    async execute(
        input:
            Readonly<GetMyAthleteOnboardingStatusQuery>,
    ): Promise<Result<AthleteOnboardingStatusDto>> {
        try {
            return Result.success(
                await this.query.execute(
                    Object.freeze({
                        userId: input.userId,
                        tenantId: input.tenantId,
                    }),
                ),
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Onboarding status could not be determined.",
            );
        }
    }
}
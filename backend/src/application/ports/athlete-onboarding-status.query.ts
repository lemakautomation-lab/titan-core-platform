import { AthleteOnboardingStatusDto } from "../dto/athlete/athlete-onboarding-status.dto";

export interface AthleteOnboardingStatusQueryInput {
    userId: string;
    tenantId: string;
}

export interface AthleteOnboardingStatusQuery {
    execute(
        input:
            Readonly<AthleteOnboardingStatusQueryInput>,
    ): Promise<AthleteOnboardingStatusDto>;
}
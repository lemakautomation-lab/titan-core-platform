import { AthleteGoalsDto } from "../dto/athlete/athlete-goals.dto";

export interface AthleteGoalsUpdateInput {
    userId: string;
    tenantId: string;
    primaryGoal: unknown;
    secondaryGoals: readonly unknown[];
}

export interface AthleteGoalsUpdateTransaction {
    execute(
        input: Readonly<AthleteGoalsUpdateInput>,
    ): Promise<AthleteGoalsDto>;
}

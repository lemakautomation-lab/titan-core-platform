import { ProgrammeGoalClassification } from "../../../domain/enums/programme-goal-classification.enum";

export interface AthleteGoalsDto {
    athleteId: string;
    tenantId: string;
    primaryGoal: ProgrammeGoalClassification;
    secondaryGoals: ProgrammeGoalClassification[];
}

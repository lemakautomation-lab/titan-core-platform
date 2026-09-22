export interface StrengthConditioningWorkflowDto {
    athleteId: string;
    workoutProgrammes: unknown[];
    trainingStress: Array<{
        id: string;
        athleteId: string;
        value: unknown;
        recordedAt: string;
        createdAt: string;
        sourceType: string;
        sourceId: string | null;
        sourceObservationId: string | null;
    }>;
}

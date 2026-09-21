export interface PerformanceProfessionalObservationDto {
    id: string;
    athleteId: string;
    value: unknown;
    recordedAt: string;
    createdAt: string;
    sourceType: string;
    sourceId: string | null;
    sourceObservationId: string | null;
}

export interface PerformanceProfessionalWorkflowDto {
    athleteId: string;
    performance: Array<{
        metric: unknown;
        measurements: unknown[];
    }>;
    recovery: PerformanceProfessionalObservationDto[];
    trainingStress: PerformanceProfessionalObservationDto[];
    workoutProgrammes: unknown[];
}
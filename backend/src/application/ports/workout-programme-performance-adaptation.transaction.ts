import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";

export interface WorkoutProgrammePerformanceAdaptationInput {
    programmeId: string;
    tenantId: string;
    actorUserId: string;
    athleteId: string;
    metricId: string;
    measurementId: string;
    trainingFrequencyDelta: number;
    sessionDurationMinutesDelta: number;
    rationale: string;
}

export interface WorkoutProgrammePerformanceAdaptationTransaction {
    execute(
        input: WorkoutProgrammePerformanceAdaptationInput,
    ): Promise<WorkoutProgramme>;
}

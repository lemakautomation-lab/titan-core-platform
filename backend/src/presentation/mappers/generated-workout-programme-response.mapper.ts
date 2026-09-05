import { WorkoutProgrammeGenerationTransactionOutcome } from "../../application/ports/workout-programme-generation.transaction";

export class GeneratedWorkoutProgrammeResponseMapper {
    static toResponse(outcome: WorkoutProgrammeGenerationTransactionOutcome) {
        return {
            replayed: outcome.status === "replayed",
            generationId: outcome.generation.id,
            programme: {
                id: outcome.programme.id,
                athleteId: outcome.programme.athleteId,
                name: outcome.programme.name,
                description: outcome.programme.description,
                goal: outcome.programme.goal,
                experience: outcome.programme.experience,
                trainingFrequency: outcome.programme.trainingFrequency,
                sessionDurationMinutes: outcome.programme.sessionDurationMinutes,
                sportId: outcome.programme.sportId,
                status: outcome.programme.status,
                createdAt: outcome.programme.createdAt,
                updatedAt: outcome.programme.updatedAt,
                sessions: outcome.structure.sessions.map(session => ({
                    id: session.id,
                    ordinal: session.ordinal,
                    name: session.name,
                    exercises: session.prescriptions.map(prescription => ({
                        id: prescription.id,
                        ordinal: prescription.ordinal,
                        exerciseId: prescription.exerciseId,
                        sets: prescription.sets,
                        repetitions: prescription.repetitions,
                        durationSeconds: prescription.durationSeconds,
                        restSeconds: prescription.restSeconds,
                    })),
                })),
            },
        };
    }
}

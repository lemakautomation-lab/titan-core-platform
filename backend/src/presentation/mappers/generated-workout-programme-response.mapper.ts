import { WorkoutProgrammeGenerationTransactionOutcome } from "../../application/ports/workout-programme-generation.transaction";
import { GeneratedWorkoutProgrammeReadModel } from "../../application/ports/generated-workout-programme-read.repository";
import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";
import { WorkoutProgrammeStructure } from "../../domain/entities/workout-programme-structure.entity";

export class GeneratedWorkoutProgrammeResponseMapper {
    static toResponse(outcome: WorkoutProgrammeGenerationTransactionOutcome) {
        return {
            replayed: outcome.status === "replayed",
            generationId: outcome.generation.id,
            programme: this.toProgramme(outcome.programme, outcome.structure),
        };
    }

    static toRetrievalResponse(result: GeneratedWorkoutProgrammeReadModel) {
        return {
            generationId: result.generationId,
            programme: this.toProgramme(result.programme, result.structure),
        };
    }

    private static toProgramme(
        programme: WorkoutProgramme,
        structure: WorkoutProgrammeStructure,
    ) {
        return {
            id: programme.id,
            athleteId: programme.athleteId,
            name: programme.name,
            description: programme.description,
            goal: programme.goal,
            experience: programme.experience,
            trainingFrequency: programme.trainingFrequency,
            sessionDurationMinutes: programme.sessionDurationMinutes,
            sportId: programme.sportId,
            status: programme.status,
            createdAt: programme.createdAt,
            updatedAt: programme.updatedAt,
            sessions: structure.sessions.map(session => ({
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
        };
    }
}

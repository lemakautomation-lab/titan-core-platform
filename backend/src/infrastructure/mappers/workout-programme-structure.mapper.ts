import { WorkoutProgrammeExercisePrescription } from "../../domain/entities/workout-programme-exercise-prescription.entity";
import { WorkoutProgrammeSession } from "../../domain/entities/workout-programme-session.entity";
import { WorkoutProgrammeStructure } from "../../domain/entities/workout-programme-structure.entity";

interface PersistencePrescription {
    id: string;
    tenantId: string;
    sessionId: string;
    exerciseId: string;
    ordinal: number;
    sets: number;
    repetitions: number | null;
    durationSeconds: number | null;
    restSeconds: number | null;
    createdAt: Date;
    updatedAt: Date;
}

interface PersistenceSession {
    id: string;
    tenantId: string;
    programmeId: string;
    ordinal: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    prescriptions: PersistencePrescription[];
}

export class WorkoutProgrammeStructureMapper {
    static toDomain(
        tenantId: string,
        programmeId: string,
        sessions: PersistenceSession[],
    ): WorkoutProgrammeStructure {
        return WorkoutProgrammeStructure.restore(
            tenantId,
            programmeId,
            sessions.map(session => WorkoutProgrammeSession.restore(
                session.id,
                session.tenantId,
                session.programmeId,
                session.ordinal,
                session.name,
                session.prescriptions.map(prescription =>
                    WorkoutProgrammeExercisePrescription.restore(
                        prescription.id,
                        prescription.tenantId,
                        prescription.sessionId,
                        prescription.exerciseId,
                        prescription.ordinal,
                        prescription.sets,
                        prescription.repetitions,
                        prescription.durationSeconds,
                        prescription.restSeconds,
                        prescription.createdAt,
                        prescription.updatedAt,
                    ),
                ),
                session.createdAt,
                session.updatedAt,
            )),
        );
    }
}

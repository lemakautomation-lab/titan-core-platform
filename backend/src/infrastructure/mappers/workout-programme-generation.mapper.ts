import { WorkoutProgrammeGeneration as PersistenceGeneration } from "../../generated/prisma/client";
import { WorkoutProgrammeGeneration } from "../../domain/entities/workout-programme-generation.entity";

export class WorkoutProgrammeGenerationMapper {
    static toDomain(
        generation: PersistenceGeneration,
    ): WorkoutProgrammeGeneration {
        return WorkoutProgrammeGeneration.restore(
            generation.id,
            generation.tenantId,
            generation.programmeId,
            generation.actorUserId,
            generation.idempotencyKey,
            generation.requestFingerprint,
            generation.requestFingerprintVersion,
            generation.planFingerprint,
            generation.rulesetId,
            generation.rulesetVersion,
            generation.inputSnapshot,
            generation.planSnapshot,
            generation.createdAt,
        );
    }
}

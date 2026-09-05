import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";
import { WorkoutProgrammeGeneration } from "../../domain/entities/workout-programme-generation.entity";
import { WorkoutProgrammeStructure } from "../../domain/entities/workout-programme-structure.entity";
import { ProgrammeExercisePrescriptionCandidate } from "../../domain/value-objects/programme-exercise-prescription-candidate.value-object";
import { GeneratedProgrammePlan } from "../../domain/value-objects/generated-programme-plan.value-object";
import { ProgrammeGenerationInput } from "../../domain/value-objects/programme-generation-input.value-object";
import { ProgrammeGenerationRuleset } from "../../domain/value-objects/programme-generation-ruleset.value-object";
import { ImmutableJsonValue } from "../../domain/entities/workout-programme-generation.entity";

export interface WorkoutProgrammeGenerationTransactionInput {
    readonly tenantId: string;
    readonly actorUserId: string;
    readonly idempotencyKey: string;
    readonly generationInput: ProgrammeGenerationInput;
    readonly candidates: readonly ProgrammeExercisePrescriptionCandidate[];
    readonly plan: GeneratedProgrammePlan;
    readonly ruleset: ProgrammeGenerationRuleset;
    readonly requestFingerprint: string;
    readonly requestFingerprintVersion: "1";
    readonly planFingerprint: string;
    readonly inputSnapshot: ImmutableJsonValue;
    readonly planSnapshot: ImmutableJsonValue;
}

export interface WorkoutProgrammeGenerationTransactionOutcome {
    readonly status: "created" | "replayed";
    readonly programme: WorkoutProgramme;
    readonly structure: WorkoutProgrammeStructure;
    readonly generation: WorkoutProgrammeGeneration;
}

export interface WorkoutProgrammeGenerationTransaction {
    execute(
        input: WorkoutProgrammeGenerationTransactionInput,
    ): Promise<WorkoutProgrammeGenerationTransactionOutcome>;
}

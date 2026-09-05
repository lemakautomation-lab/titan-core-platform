import { ProgrammeExercisePrescriptionCandidate } from "../value-objects/programme-exercise-prescription-candidate.value-object";
import { GeneratedProgrammePlan } from "../value-objects/generated-programme-plan.value-object";
import { GeneratedProgrammePrescriptionPlan } from "../value-objects/generated-programme-prescription-plan.value-object";
import { GeneratedProgrammeSessionPlan } from "../value-objects/generated-programme-session-plan.value-object";
import { ProgrammeGenerationInput } from "../value-objects/programme-generation-input.value-object";
import { ProgrammeGenerationRuleset } from "../value-objects/programme-generation-ruleset.value-object";

export class DeterministicProgrammeGenerationService {
    static generate(
        input: ProgrammeGenerationInput,
        candidates: readonly ProgrammeExercisePrescriptionCandidate[],
        ruleset: ProgrammeGenerationRuleset,
    ): GeneratedProgrammePlan {
        if (!(input instanceof ProgrammeGenerationInput)) {
            throw new Error("Programme generation input is required.");
        }
        if (!(ruleset instanceof ProgrammeGenerationRuleset)) {
            throw new Error("Generation ruleset is required.");
        }
        if (!Array.isArray(candidates)) {
            throw new Error("Prescription-ready candidates must be an array.");
        }
        if (candidates.length === 0) {
            throw new Error("No prescription-ready Exercises are available.");
        }
        if (
            !Number.isSafeInteger(input.trainingFrequency) ||
            input.trainingFrequency < 1
        ) {
            throw new Error("Training frequency must be a positive safe integer.");
        }

        const ordered = this.validateAndOrderCandidates(input, candidates);
        const durationLimitSeconds = this.checkedMultiply(
            input.sessionDurationMinutes,
            60,
        );

        if (!ordered.some(candidate =>
            candidate.approximatePrescriptionSeconds <= durationLimitSeconds,
        )) {
            throw new Error("No prescription-ready Exercise fits the session duration.");
        }

        const sessions: GeneratedProgrammeSessionPlan[] = [];
        for (
            let sessionOrdinal = 1;
            sessionOrdinal <= input.trainingFrequency;
            sessionOrdinal += 1
        ) {
            let remaining = durationLimitSeconds;
            const prescriptions: GeneratedProgrammePrescriptionPlan[] = [];
            const offset = (sessionOrdinal - 1) % ordered.length;

            for (let step = 0; step < ordered.length; step += 1) {
                const candidate = ordered[(offset + step) % ordered.length];
                if (candidate.approximatePrescriptionSeconds > remaining) {
                    continue;
                }

                prescriptions.push(
                    GeneratedProgrammePrescriptionPlan.fromCandidate(
                        prescriptions.length + 1,
                        candidate,
                    ),
                );
                remaining = this.checkedSubtract(
                    remaining,
                    candidate.approximatePrescriptionSeconds,
                );
            }

            if (prescriptions.length === 0) {
                throw new Error("Generated session is unsatisfiable.");
            }

            sessions.push(GeneratedProgrammeSessionPlan.create(
                sessionOrdinal,
                `Session ${sessionOrdinal}`,
                prescriptions,
                durationLimitSeconds,
            ));
        }

        return GeneratedProgrammePlan.create(
            ruleset,
            input,
            `Generated ${input.goal.classification} Programme`,
            sessions,
        );
    }

    private static validateAndOrderCandidates(
        input: ProgrammeGenerationInput,
        candidates: readonly ProgrammeExercisePrescriptionCandidate[],
    ): ProgrammeExercisePrescriptionCandidate[] {
        const exerciseIds = new Set<string>();
        const profileIds = new Set<string>();
        const copy: ProgrammeExercisePrescriptionCandidate[] = [];

        for (const candidate of candidates) {
            if (!(candidate instanceof ProgrammeExercisePrescriptionCandidate)) {
                throw new Error("Prescription-ready candidate is invalid.");
            }
            if (
                candidate.goalClassification !== input.goal.classification ||
                candidate.trainingExperience !== input.trainingExperience
            ) {
                throw new Error("Prescription-ready candidate context does not match.");
            }
            if (exerciseIds.has(candidate.exerciseId)) {
                throw new Error("Duplicate candidate Exercise identity.");
            }
            if (profileIds.has(candidate.profileId)) {
                throw new Error("Duplicate candidate profile identity.");
            }
            exerciseIds.add(candidate.exerciseId);
            profileIds.add(candidate.profileId);
            copy.push(candidate);
        }

        return copy.sort((left, right) =>
            left.exerciseId < right.exerciseId
                ? -1
                : left.exerciseId > right.exerciseId
                    ? 1
                    : 0,
        );
    }

    private static checkedMultiply(left: number, right: number): number {
        const result = left * right;
        if (!Number.isSafeInteger(result) || result < 1) {
            throw new Error("Generation duration arithmetic overflow.");
        }
        return result;
    }

    private static checkedSubtract(left: number, right: number): number {
        const result = left - right;
        if (!Number.isSafeInteger(result) || result < 0) {
            throw new Error("Generation duration arithmetic failure.");
        }
        return result;
    }
}

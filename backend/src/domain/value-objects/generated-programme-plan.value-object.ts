import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";
import { GeneratedProgrammeSessionPlan } from "./generated-programme-session-plan.value-object";
import { ProgrammeGenerationInput } from "./programme-generation-input.value-object";
import { ProgrammeGenerationRuleset } from "./programme-generation-ruleset.value-object";

export class GeneratedProgrammePlan {
    private readonly orderedSessions: readonly GeneratedProgrammeSessionPlan[];

    private constructor(
        public readonly rulesetId: string,
        public readonly rulesetVersion: string,
        public readonly athleteId: string,
        public readonly goalClassification: ProgrammeGoalClassification,
        public readonly trainingExperience: TrainingExperienceLevel,
        public readonly sportId: string | null,
        public readonly trainingFrequency: number,
        public readonly sessionDurationMinutes: number,
        public readonly name: string,
        public readonly description: null,
        public readonly legacyGoal: string,
        public readonly legacyExperience: string,
        sessions: readonly GeneratedProgrammeSessionPlan[],
    ) {
        this.orderedSessions = Object.freeze([...sessions]);
        Object.freeze(this);
    }

    static create(
        ruleset: ProgrammeGenerationRuleset,
        input: ProgrammeGenerationInput,
        name: unknown,
        sessions: readonly GeneratedProgrammeSessionPlan[],
    ): GeneratedProgrammePlan {
        if (!(ruleset instanceof ProgrammeGenerationRuleset)) {
            throw new Error("Generation ruleset is required.");
        }
        if (!(input instanceof ProgrammeGenerationInput)) {
            throw new Error("Programme generation input is required.");
        }
        if (typeof name !== "string" || !name.trim()) {
            throw new Error("Generated Programme name is required.");
        }
        if (
            !Array.isArray(sessions) ||
            sessions.length !== input.trainingFrequency
        ) {
            throw new Error("Generated session count must equal training frequency.");
        }

        const ordered = [...sessions].sort(
            (left, right) => left.ordinal - right.ordinal,
        );
        const ordinals = new Set<number>();

        for (let index = 0; index < ordered.length; index += 1) {
            const session = ordered[index];
            if (!(session instanceof GeneratedProgrammeSessionPlan)) {
                throw new Error("Generated session plan is invalid.");
            }
            if (ordinals.has(session.ordinal) || session.ordinal !== index + 1) {
                throw new Error("Generated session ordinals must be contiguous.");
            }
            ordinals.add(session.ordinal);
        }

        return new GeneratedProgrammePlan(
            ruleset.id,
            ruleset.version,
            input.athleteId,
            input.goal.classification,
            input.trainingExperience,
            input.sportId,
            input.trainingFrequency,
            input.sessionDurationMinutes,
            name.trim(),
            null,
            input.goal.classification,
            input.trainingExperience,
            ordered,
        );
    }

    get sessions(): readonly GeneratedProgrammeSessionPlan[] {
        return Object.freeze([...this.orderedSessions]);
    }
}

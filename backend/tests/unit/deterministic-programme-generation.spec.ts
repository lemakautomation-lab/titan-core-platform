import { describe, expect, it } from "vitest";

import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { DeterministicProgrammeGenerationService } from "../../src/domain/services/deterministic-programme-generation.service";
import { ProgrammeExercisePrescriptionCandidate } from "../../src/domain/value-objects/programme-exercise-prescription-candidate.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { ProgrammeGenerationInput } from "../../src/domain/value-objects/programme-generation-input.value-object";
import { ProgrammeGenerationRuleset } from "../../src/domain/value-objects/programme-generation-ruleset.value-object";

function input(overrides: {
    goal?: ProgrammeGoalClassification;
    experience?: TrainingExperienceLevel;
    frequency?: number;
    duration?: number;
} = {}) {
    return ProgrammeGenerationInput.create({
        athleteId: "athlete-1",
        goal: ProgrammeGenerationGoal.create(
            overrides.goal ?? ProgrammeGoalClassification.STRENGTH,
        ),
        trainingExperience:
            overrides.experience ?? TrainingExperienceLevel.BEGINNER,
        sportId: null,
        availableEquipment: [],
        trainingFrequency: overrides.frequency ?? 2,
        sessionDurationMinutes: overrides.duration ?? 10,
    });
}

function candidate(
    exerciseId: string,
    approximateSeconds: number,
    overrides: {
        profileId?: string;
        goal?: ProgrammeGoalClassification;
        experience?: TrainingExperienceLevel;
        mode?: ExercisePrescriptionMode;
        sets?: number;
        rest?: number;
        version?: number;
    } = {},
) {
    const mode = overrides.mode ?? ExercisePrescriptionMode.REPETITIONS;
    const sets = overrides.sets ?? 1;
    const rest = overrides.rest ?? 0;
    const workSeconds = approximateSeconds - (sets - 1) * rest;

    const profile = ExercisePrescriptionProfile.restore(
        overrides.profileId ?? `profile-${exerciseId}`,
        "tenant-1",
        exerciseId,
        overrides.goal ?? ProgrammeGoalClassification.STRENGTH,
        overrides.experience ?? TrainingExperienceLevel.BEGINNER,
        overrides.version ?? 1,
        mode,
        sets,
        mode === ExercisePrescriptionMode.REPETITIONS ? 8 : null,
        mode === ExercisePrescriptionMode.DURATION
            ? workSeconds / sets
            : null,
        rest,
        mode === ExercisePrescriptionMode.REPETITIONS
            ? workSeconds / sets
            : null,
        RecordStatus.ACTIVE,
        new Date(0),
        new Date(0),
    );

    return ProgrammeExercisePrescriptionCandidate.fromProfile(
        exerciseId,
        profile,
    );
}

function generate(
    generationInput: ProgrammeGenerationInput,
    candidates: readonly ProgrammeExercisePrescriptionCandidate[],
) {
    return DeterministicProgrammeGenerationService.generate(
        generationInput,
        candidates,
        ProgrammeGenerationRuleset.v1(),
    );
}

describe("Programme generation ruleset", () => {
    it("exposes the approved immutable v1 identity", () => {
        const ruleset = ProgrammeGenerationRuleset.v1();
        expect(ruleset).toEqual({
            id: "TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION",
            version: "1.0.0",
        });
        expect(Object.isFrozen(ruleset)).toBe(true);
    });

    it.each([
        ["OTHER", "1.0.0"],
        ["TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION", "2.0.0"],
        ["", ""],
    ])("rejects unsupported ruleset %s %s", (id, version) => {
        expect(() => ProgrammeGenerationRuleset.create(id, version))
            .toThrow("Unsupported generation ruleset.");
    });
});

describe("Deterministic initial Programme generation", () => {
    it("produces identical plans for identical semantic inputs", () => {
        const generationInput = input();
        const candidates = [candidate("b", 250), candidate("a", 300)];
        expect(generate(generationInput, candidates))
            .toEqual(generate(generationInput, candidates));
    });

    it("is independent of candidate input order", () => {
        const candidates = [
            candidate("c", 150),
            candidate("a", 400),
            candidate("b", 250),
        ];
        expect(generate(input(), candidates))
            .toEqual(generate(input(), [...candidates].reverse()));
    });

    it("uses deterministic rotated first-fit packing", () => {
        const plan = generate(input({ frequency: 2 }), [
            candidate("a", 400),
            candidate("b", 250),
            candidate("c", 150),
        ]);

        expect(plan.sessions.map(session => ({
            exercises: session.prescriptions.map(item => item.exerciseId),
            total: session.approximateDurationSeconds,
        }))).toEqual([
            { exercises: ["a", "c"], total: 550 },
            { exercises: ["b", "c"], total: 400 },
        ]);
    });

    it("creates exactly the requested number of ordered named sessions", () => {
        const plan = generate(input({ frequency: 4 }), [candidate("a", 60)]);
        expect(plan.sessions.map(session => [session.ordinal, session.name]))
            .toEqual([
                [1, "Session 1"],
                [2, "Session 2"],
                [3, "Session 3"],
                [4, "Session 4"],
            ]);
    });

    it("allows cross-session reuse but no within-session duplicate", () => {
        const plan = generate(input({ frequency: 3 }), [candidate("a", 60)]);
        expect(plan.sessions.map(session =>
            session.prescriptions.map(item => item.exerciseId),
        )).toEqual([["a"], ["a"], ["a"]]);
        expect(plan.sessions.every(session =>
            new Set(session.prescriptions.map(item => item.exerciseId)).size ===
                session.prescriptions.length,
        )).toBe(true);
    });

    it("keeps unused capacity and never changes governed prescriptions", () => {
        const source = candidate("a", 210, { sets: 3, rest: 60, version: 7 });
        const plan = generate(input({ frequency: 1 }), [source]);
        const prescription = plan.sessions[0].prescriptions[0];
        expect(prescription).toEqual(expect.objectContaining({
            profileId: source.profileId,
            profileVersion: 7,
            prescriptionMode: source.prescriptionMode,
            sets: source.sets,
            repetitions: source.repetitions,
            durationSeconds: source.durationSeconds,
            restSeconds: source.restSeconds,
            estimatedSetDurationSeconds: source.estimatedSetDurationSeconds,
            approximatePrescriptionSeconds: 210,
        }));
        expect(plan.sessions[0].approximateDurationSeconds).toBeLessThan(600);
    });

    it("copies duration-mode prescription values verbatim", () => {
        const source = candidate("a", 105, {
            mode: ExercisePrescriptionMode.DURATION,
            sets: 2,
            rest: 15,
        });
        const prescription = generate(input({ frequency: 1 }), [source])
            .sessions[0].prescriptions[0];
        expect(prescription).toEqual(expect.objectContaining({
            sets: 2,
            repetitions: null,
            durationSeconds: 45,
            restSeconds: 15,
            estimatedSetDurationSeconds: null,
            approximatePrescriptionSeconds: 105,
        }));
    });

    it("skips a candidate that cannot fit without relaxing the bound", () => {
        const plan = generate(input({ frequency: 1, duration: 5 }), [
            candidate("a", 400),
            candidate("b", 250),
        ]);
        expect(plan.sessions[0].prescriptions.map(item => item.exerciseId))
            .toEqual(["b"]);
        expect(plan.sessions[0].approximateDurationSeconds).toBe(250);
    });

    it("fails without partial output when no candidate fits", () => {
        expect(() => generate(input({ duration: 5 }), [
            candidate("a", 301),
            candidate("b", 600),
        ])).toThrow("No prescription-ready Exercise fits the session duration.");
    });

    it("fails for an empty candidate collection", () => {
        expect(() => generate(input(), []))
            .toThrow("No prescription-ready Exercises are available.");
    });

    it("rejects duplicate Exercise and profile identities", () => {
        expect(() => generate(input(), [candidate("a", 60), candidate("a", 60, {
            profileId: "other",
        })])).toThrow("Duplicate candidate Exercise identity.");
        expect(() => generate(input(), [candidate("a", 60, {
            profileId: "same",
        }), candidate("b", 60, { profileId: "same" })]))
            .toThrow("Duplicate candidate profile identity.");
    });

    it("rejects candidate Goal and experience mismatches", () => {
        expect(() => generate(input(), [candidate("a", 60, {
            goal: ProgrammeGoalClassification.POWER,
        })])).toThrow("candidate context does not match");
        expect(() => generate(input(), [candidate("a", 60, {
            experience: TrainingExperienceLevel.ADVANCED,
        })])).toThrow("candidate context does not match");
    });

    it("fails checked duration arithmetic overflow", () => {
        expect(() => generate(input({
            frequency: 1,
            duration: Number.MAX_SAFE_INTEGER,
        }), [candidate("a", 60)])).toThrow(
            "Generation duration arithmetic overflow.",
        );
    });

    it("does not mutate candidate input and returns deeply immutable output", () => {
        const candidates = [candidate("b", 60), candidate("a", 60)];
        const originalOrder = candidates.map(item => item.exerciseId);
        const plan = generate(input({ frequency: 1 }), candidates);
        expect(candidates.map(item => item.exerciseId)).toEqual(originalOrder);
        expect(Object.isFrozen(plan)).toBe(true);
        expect(Object.isFrozen(plan.sessions)).toBe(true);
        expect(Object.isFrozen(plan.sessions[0])).toBe(true);
        expect(Object.isFrozen(plan.sessions[0].prescriptions)).toBe(true);
        expect(Object.isFrozen(plan.sessions[0].prescriptions[0])).toBe(true);
    });

    it("uses deterministic programme metadata and canonical legacy mappings", () => {
        const plan = generate(input(), [candidate("a", 60)]);
        expect(plan).toEqual(expect.objectContaining({
            rulesetId: "TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION",
            rulesetVersion: "1.0.0",
            athleteId: "athlete-1",
            name: "Generated STRENGTH Programme",
            description: null,
            legacyGoal: "STRENGTH",
            legacyExperience: "BEGINNER",
        }));
        expect("id" in plan).toBe(false);
        expect("createdAt" in plan).toBe(false);
    });

    it.each(Object.values(ProgrammeGoalClassification))(
        "supports canonical Goal %s using matching governed candidates",
        goal => {
            const plan = generate(input({ goal }), [candidate("a", 60, { goal })]);
            expect(plan.goalClassification).toBe(goal);
        },
    );

    it.each(Object.values(TrainingExperienceLevel))(
        "supports canonical experience %s using matching governed candidates",
        experience => {
            const plan = generate(input({ experience }), [
                candidate("a", 60, { experience }),
            ]);
            expect(plan.trainingExperience).toBe(experience);
        },
    );
});

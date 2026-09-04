import { describe, expect, it } from "vitest";

import { Exercise } from "../../src/domain/entities/exercise.entity";
import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeExercisePrescriptionReadinessService } from "../../src/domain/services/programme-exercise-prescription-readiness.service";
import { ProgrammeExerciseEligibilityCriteria } from "../../src/domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";

function criteria() {
    return ProgrammeExerciseEligibilityCriteria.create(
        "tenant-1",
        ProgrammeGenerationGoal.create(ProgrammeGoalClassification.STRENGTH),
        TrainingExperienceLevel.BEGINNER,
        null,
        [],
    );
}

function exercise(id: string, overrides: Partial<Exercise> = {}) {
    return new Exercise(
        id,
        overrides.tenantId ?? "tenant-1",
        "Exercise",
        `exercise-${id}`,
        null,
        "Push",
        ["Chest"],
        [],
        "Strength",
        "Beginner",
        null,
        null,
        overrides.status ?? RecordStatus.ACTIVE,
        new Date(0),
        new Date(0),
    );
}

function profile(
    exerciseId: string,
    overrides: Record<string, unknown> = {},
) {
    return ExercisePrescriptionProfile.restore(
        overrides.id ?? `profile-${exerciseId}`,
        overrides.tenantId ?? "tenant-1",
        exerciseId,
        overrides.goal ?? ProgrammeGoalClassification.STRENGTH,
        overrides.experience ?? TrainingExperienceLevel.BEGINNER,
        overrides.version ?? 1,
        overrides.mode ?? ExercisePrescriptionMode.REPETITIONS,
        overrides.sets ?? 3,
        Object.prototype.hasOwnProperty.call(overrides, "repetitions")
            ? overrides.repetitions
            : 8,
        Object.prototype.hasOwnProperty.call(overrides, "duration")
            ? overrides.duration
            : null,
        overrides.rest ?? 60,
        Object.prototype.hasOwnProperty.call(overrides, "estimated")
            ? overrides.estimated
            : 30,
        overrides.status ?? RecordStatus.ACTIVE,
        new Date(0),
        new Date(0),
    );
}

describe("Programme Exercise prescription candidate", () => {
    it("creates an immutable repetitions snapshot with exact duration", () => {
        const result = ProgrammeExercisePrescriptionReadinessService
            .createCandidates(criteria(), [exercise("exercise-1")], [
                profile("exercise-1"),
            ]);

        expect(result[0]).toEqual(expect.objectContaining({
            exerciseId: "exercise-1",
            profileId: "profile-exercise-1",
            profileVersion: 1,
            prescriptionMode: ExercisePrescriptionMode.REPETITIONS,
            sets: 3,
            repetitions: 8,
            durationSeconds: null,
            restSeconds: 60,
            estimatedSetDurationSeconds: 30,
            approximatePrescriptionSeconds: 210,
        }));
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result[0])).toBe(true);
    });

    it("creates a valid immutable duration snapshot", () => {
        const result = ProgrammeExercisePrescriptionReadinessService
            .createCandidates(criteria(), [exercise("exercise-1")], [
                profile("exercise-1", {
                    mode: ExercisePrescriptionMode.DURATION,
                    repetitions: null,
                    duration: 45,
                    estimated: null,
                    rest: 15,
                    sets: 2,
                }),
            ]);

        expect(result[0]).toEqual(expect.objectContaining({
            repetitions: null,
            durationSeconds: 45,
            estimatedSetDurationSeconds: null,
            approximatePrescriptionSeconds: 105,
        }));
    });
});

describe("Programme Exercise prescription readiness", () => {
    it("orders candidates by ordinal Exercise ID and copies the inputs", () => {
        const exercises = [exercise("z"), exercise("a")];
        const profiles = [profile("z"), profile("a")];
        const result = ProgrammeExercisePrescriptionReadinessService
            .createCandidates(criteria(), exercises, profiles);

        exercises.splice(0);
        profiles.splice(0);
        expect(result.map(candidate => candidate.exerciseId)).toEqual(["a", "z"]);
        expect(result).toHaveLength(2);
    });

    it("omits eligible Exercises without a supplied active exact profile", () => {
        const result = ProgrammeExercisePrescriptionReadinessService
            .createCandidates(
                criteria(),
                [exercise("a"), exercise("b")],
                [profile("b")],
            );
        expect(result.map(candidate => candidate.exerciseId)).toEqual(["b"]);
    });

    it("returns an immutable empty collection", () => {
        const result = ProgrammeExercisePrescriptionReadinessService
            .createCandidates(criteria(), [exercise("a")], []);
        expect(result).toEqual([]);
        expect(Object.isFrozen(result)).toBe(true);
    });

    it.each([
        ["tenant", { tenantId: "tenant-2" }],
        ["inactive", { status: RecordStatus.INACTIVE }],
        ["goal", { goal: ProgrammeGoalClassification.POWER }],
        ["experience", { experience: TrainingExperienceLevel.ADVANCED }],
    ])("fails closed for an out-of-scope %s profile", (_label, overrides) => {
        expect(() => ProgrammeExercisePrescriptionReadinessService
            .createCandidates(criteria(), [exercise("a")], [
                profile("a", overrides),
            ])).toThrow("outside the readiness scope");
    });

    it("rejects duplicate eligible Exercise identities", () => {
        expect(() => ProgrammeExercisePrescriptionReadinessService
            .createCandidates(
                criteria(),
                [exercise("a"), exercise("a")],
                [],
            )).toThrow("Duplicate eligible Exercise identity");
    });

    it("rejects duplicate profile identities", () => {
        expect(() => ProgrammeExercisePrescriptionReadinessService
            .createCandidates(
                criteria(),
                [exercise("a"), exercise("b")],
                [profile("a", { id: "same" }), profile("b", { id: "same" })],
            )).toThrow("Duplicate prescription profile identity");
    });

    it("rejects ambiguous active profiles for one Exercise", () => {
        expect(() => ProgrammeExercisePrescriptionReadinessService
            .createCandidates(
                criteria(),
                [exercise("a")],
                [profile("a"), profile("a", { id: "profile-2", version: 2 })],
            )).toThrow("Ambiguous active prescription profiles");
    });

    it("rejects malformed Exercise and profile snapshots", () => {
        expect(() => ProgrammeExercisePrescriptionReadinessService
            .createCandidates(criteria(), [{} as Exercise], []))
            .toThrow("Eligible Exercise data are invalid");
        expect(() => ProgrammeExercisePrescriptionReadinessService
            .createCandidates(
                criteria(),
                [exercise("a")],
                [{} as ExercisePrescriptionProfile],
            )).toThrow("Exercise prescription profile data are invalid");
    });
});

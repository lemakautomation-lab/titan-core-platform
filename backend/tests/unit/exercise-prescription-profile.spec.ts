import { describe, expect, it } from "vitest";

import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";

function properties(overrides: Record<string, unknown> = {}) {
    return {
        tenantId: "tenant-1",
        exerciseId: "exercise-1",
        goalClassification: ProgrammeGoalClassification.STRENGTH,
        trainingExperience: TrainingExperienceLevel.BEGINNER,
        version: 1,
        prescriptionMode: ExercisePrescriptionMode.REPETITIONS,
        defaultSets: 3,
        defaultRepetitions: 8,
        defaultDurationSeconds: null,
        defaultRestSeconds: 60,
        estimatedSetDurationSeconds: 30,
        ...overrides,
    };
}

describe("Exercise Prescription Profile", () => {
    it("creates an immutable inactive repetitions profile", () => {
        const profile = ExercisePrescriptionProfile.create(properties());

        expect(profile.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(profile.status).toBe(RecordStatus.INACTIVE);
        expect(profile.approximatePrescriptionSeconds).toBe(210);
        expect(Object.isFrozen(profile)).toBe(true);
    });

    it("calculates duration-mode time with rest only between sets", () => {
        const profile = ExercisePrescriptionProfile.create(properties({
            prescriptionMode: ExercisePrescriptionMode.DURATION,
            defaultSets: 4,
            defaultRepetitions: null,
            defaultDurationSeconds: 45,
            defaultRestSeconds: 30,
            estimatedSetDurationSeconds: null,
        }));

        expect(profile.approximatePrescriptionSeconds).toBe(270);
    });

    it.each(Object.values(ProgrammeGoalClassification))(
        "accepts canonical Goal %s",
        goalClassification => {
            expect(ExercisePrescriptionProfile.create(properties({
                goalClassification,
            })).goalClassification).toBe(goalClassification);
        },
    );

    it.each(Object.values(TrainingExperienceLevel))(
        "accepts canonical experience %s",
        trainingExperience => {
            expect(ExercisePrescriptionProfile.create(properties({
                trainingExperience,
            })).trainingExperience).toBe(trainingExperience);
        },
    );

    it.each([
        ["tenantId", "", "Tenant ID is required."],
        ["tenantId", "null", "Tenant ID is required."],
        ["exerciseId", " ", "Exercise ID is required."],
        ["exerciseId", "undefined", "Exercise ID is required."],
    ])("rejects invalid %s", (field, value, message) => {
        expect(() => ExercisePrescriptionProfile.create(properties({
            [field]: value,
        }))).toThrow(message);
    });

    it.each([
        ["goalClassification", "Strength", "Goal classification is invalid."],
        ["trainingExperience", "EXPERT", "Training experience is invalid."],
        ["prescriptionMode", "COUNT", "Prescription mode is invalid."],
        ["status", "DRAFT", "Profile status is invalid."],
    ])("rejects noncanonical %s", (field, value, message) => {
        expect(() => ExercisePrescriptionProfile.create(properties({
            [field]: value,
        }))).toThrow(message);
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        "rejects invalid version %s",
        version => expect(() => ExercisePrescriptionProfile.create(
            properties({ version }),
        )).toThrow("Profile version must be a positive integer."),
    );

    it.each([0, -1, 1.5])("rejects invalid sets %s", defaultSets => {
        expect(() => ExercisePrescriptionProfile.create(properties({
            defaultSets,
        }))).toThrow("Default sets must be a positive integer.");
    });

    it.each([-1, 1.5])("rejects invalid rest %s", defaultRestSeconds => {
        expect(() => ExercisePrescriptionProfile.create(properties({
            defaultRestSeconds,
        }))).toThrow("Default rest must be a non-negative integer.");
    });

    it("enforces repetitions-mode values", () => {
        expect(() => ExercisePrescriptionProfile.create(properties({
            defaultRepetitions: null,
        }))).toThrow("Default repetitions must be a positive integer.");
        expect(() => ExercisePrescriptionProfile.create(properties({
            defaultDurationSeconds: 30,
        }))).toThrow("Default duration must be absent for this mode.");
        expect(() => ExercisePrescriptionProfile.create(properties({
            estimatedSetDurationSeconds: null,
        }))).toThrow("Estimated set duration must be a positive integer.");
    });

    it("enforces duration-mode values", () => {
        const duration = {
            prescriptionMode: ExercisePrescriptionMode.DURATION,
            defaultRepetitions: null,
            defaultDurationSeconds: 30,
            estimatedSetDurationSeconds: null,
        };

        expect(() => ExercisePrescriptionProfile.create(properties({
            ...duration,
            defaultDurationSeconds: 0,
        }))).toThrow("Default duration must be a positive integer.");
        expect(() => ExercisePrescriptionProfile.create(properties({
            ...duration,
            defaultRepetitions: 10,
        }))).toThrow("Default repetitions must be absent for this mode.");
        expect(() => ExercisePrescriptionProfile.create(properties({
            ...duration,
            estimatedSetDurationSeconds: 20,
        }))).toThrow("Estimated set duration must be absent for this mode.");
    });

    it("rejects an unsafe calculated approximate time", () => {
        expect(() => ExercisePrescriptionProfile.create(properties({
            defaultSets: Number.MAX_SAFE_INTEGER,
            estimatedSetDurationSeconds: 2,
        }))).toThrow(
            "Approximate prescription time must be a finite positive integer.",
        );
    });

    it("recognizes only ACTIVE as generation-ready", () => {
        for (const status of Object.values(RecordStatus)) {
            const profile = ExercisePrescriptionProfile.create(properties({
                status,
            }));
            expect(profile.isActive()).toBe(status === RecordStatus.ACTIVE);
        }
    });
});

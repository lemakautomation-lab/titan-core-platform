import { describe, expect, it } from "vitest";

import { Exercise } from "../../src/domain/entities/exercise.entity";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeExerciseEligibilityService } from "../../src/domain/services/programme-exercise-eligibility.service";
import { ProgrammeExerciseEligibilityCriteria } from "../../src/domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";

function criteria(overrides: {
    tenantId?: unknown;
    goal?: ProgrammeGoalClassification;
    experience?: TrainingExperienceLevel;
    sportId?: unknown;
    equipment?: unknown;
} = {}) {
    const tenantId = Object.prototype.hasOwnProperty.call(
        overrides,
        "tenantId",
    )
        ? overrides.tenantId
        : "tenant-1";

    return ProgrammeExerciseEligibilityCriteria.create(
        tenantId,
        ProgrammeGenerationGoal.create(
            overrides.goal ?? ProgrammeGoalClassification.STRENGTH,
        ),
        overrides.experience ?? TrainingExperienceLevel.INTERMEDIATE,
        overrides.sportId ?? null,
        overrides.equipment ?? ["barbell", "bench"],
    );
}

function exercise(overrides: Partial<Exercise> = {}) {
    return new Exercise(
        overrides.id ?? "exercise-1",
        overrides.tenantId ?? "tenant-1",
        overrides.name ?? "Exercise",
        overrides.slug ?? "exercise",
        overrides.description ?? null,
        overrides.movement ?? "Push",
        overrides.muscleGroups ?? ["Chest"],
        overrides.equipment ?? ["Barbell"],
        overrides.trainingObjective ?? "Strength",
        overrides.difficulty ?? "Intermediate",
        overrides.trainingPhase ?? null,
        overrides.sportId ?? null,
        overrides.status ?? RecordStatus.ACTIVE,
        overrides.createdAt ?? new Date(),
        overrides.updatedAt ?? new Date(),
    );
}

function eligible(
    input: ProgrammeExerciseEligibilityCriteria,
    candidate: Exercise,
) {
    return ProgrammeExerciseEligibilityService.filter(input, [candidate]);
}

describe("Programme Exercise eligibility criteria", () => {
    it.each(["", "  ", "null", "undefined", null])(
        "requires an authoritative tenant for %s",
        tenantId => {
            expect(() => criteria({ tenantId })).toThrow(
                "Tenant ID is required.",
            );
        },
    );

    it("normalizes equipment using the R1-compatible rules", () => {
        const input = criteria({
            equipment: [" Barbell ", "ＢＥＮＣＨ", "barbell"],
        });
        expect(input.availableEquipment).toEqual(["barbell", "bench"]);
    });

    it.each([[""], ["null"], ["undefined"], [42], "barbell"])(
        "rejects malformed available equipment %j",
        equipment => expect(() => criteria({ equipment })).toThrow(),
    );
});

describe("Programme Exercise eligibility service", () => {
    it("never returns another tenant's Exercise", () => {
        expect(eligible(criteria(), exercise({ tenantId: "tenant-2" })))
            .toEqual([]);
    });

    it.each([
        [RecordStatus.ACTIVE, 1],
        [RecordStatus.INACTIVE, 0],
        [RecordStatus.SUSPENDED, 0],
        [RecordStatus.DELETED, 0],
    ])("applies lifecycle status %s", (status, count) => {
        expect(eligible(criteria(), exercise({ status }))).toHaveLength(count);
    });

    it.each([
        ["sport-1", "sport-1", true],
        ["sport-1", null, true],
        ["sport-1", "sport-2", false],
        [null, null, true],
        [null, "sport-1", false],
    ])(
        "applies Programme Sport %s to Exercise Sport %s",
        (programmeSport, exerciseSport, expected) => {
            expect(eligible(
                criteria({ sportId: programmeSport }),
                exercise({ sportId: exerciseSport }),
            )).toHaveLength(expected ? 1 : 0);
        },
    );

    it("requires every Exercise equipment item while allowing bodyweight", () => {
        const input = criteria({ equipment: ["barbell", "bench"] });
        expect(eligible(input, exercise({ equipment: ["Barbell", "Bench"] })))
            .toHaveLength(1);
        expect(eligible(input, exercise({ equipment: ["Barbell", "Rack"] })))
            .toEqual([]);
        expect(eligible(input, exercise({ equipment: [] }))).toHaveLength(1);
        expect(eligible(criteria({ equipment: [] }), exercise({ equipment: [] })))
            .toHaveLength(1);
        expect(eligible(
            criteria({ equipment: [] }),
            exercise({ equipment: ["Barbell"] }),
        )).toEqual([]);
    });

    it.each([[""], ["null"], ["undefined"], [42] as unknown as string[]])(
        "fails closed for malformed Exercise equipment %j",
        equipment => {
            expect(eligible(criteria(), exercise({ equipment }))).toEqual([]);
        },
    );

    it.each([
        [TrainingExperienceLevel.BEGINNER, "Beginner", true],
        [TrainingExperienceLevel.BEGINNER, "Intermediate", false],
        [TrainingExperienceLevel.BEGINNER, "Advanced", false],
        [TrainingExperienceLevel.INTERMEDIATE, "BEGINNER", true],
        [TrainingExperienceLevel.INTERMEDIATE, "INTERMEDIATE", true],
        [TrainingExperienceLevel.INTERMEDIATE, "ADVANCED", false],
        [TrainingExperienceLevel.ADVANCED, "BEGINNER", true],
        [TrainingExperienceLevel.ADVANCED, "INTERMEDIATE", true],
        [TrainingExperienceLevel.ADVANCED, "ADVANCED", true],
    ])(
        "maps experience %s to legacy difficulty %s",
        (experience, difficulty, expected) => {
            expect(eligible(
                criteria({ experience }),
                exercise({ difficulty }),
            )).toHaveLength(expected ? 1 : 0);
        },
    );

    it.each(["Expert", "", "null", "Core Stability"])(
        "fails closed for unknown difficulty %s",
        difficulty => {
            expect(eligible(criteria(), exercise({ difficulty }))).toEqual([]);
        },
    );

    it.each(Object.values(ProgrammeGoalClassification))(
        "supports the one-to-one Goal/objective mapping for %s",
        goal => {
            const legacy = goal.toLocaleLowerCase("en-US")
                .replace(/_/gu, " ")
                .replace(/\b\w/gu, value => value.toLocaleUpperCase("en-US"));
            expect(eligible(
                criteria({ goal }),
                exercise({ trainingObjective: legacy }),
            )).toHaveLength(1);
        },
    );

    it.each(["Core Stability", "Unknown", "", "null"])(
        "fails closed for unmapped objective %s",
        trainingObjective => {
            expect(eligible(
                criteria(),
                exercise({ trainingObjective }),
            )).toEqual([]);
        },
    );

    it("does not use trainingPhase as an eligibility predicate", () => {
        expect(eligible(
            criteria(),
            exercise({ trainingPhase: "Unmapped phase" }),
        )).toHaveLength(1);
    });

    it("returns deterministic ID order without ranking or widening", () => {
        const candidates = [
            exercise({ id: "exercise-c" }),
            exercise({ id: "exercise-a" }),
            exercise({ id: "exercise-b", trainingObjective: "Unknown" }),
        ];
        const result = ProgrammeExerciseEligibilityService.filter(
            criteria(),
            candidates,
        );

        expect(result.map(item => item.id)).toEqual([
            "exercise-a",
            "exercise-c",
        ]);
        expect(ProgrammeExerciseEligibilityService.filter(
            criteria({ equipment: [] }),
            candidates,
        )).toEqual([]);
    });
});

import { describe, expect, it } from "vitest";

import { GenerateWorkoutProgrammeCommand } from "../../src/application/commands/generate-workout-programme.command";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { ProgrammeGenerationInput } from "../../src/domain/value-objects/programme-generation-input.value-object";

function createInput(
    overrides: Record<string, unknown> = {},
): ProgrammeGenerationInput {
    return ProgrammeGenerationInput.create({
        athleteId: "athlete-id",
        goal: ProgrammeGenerationGoal.create(
            ProgrammeGoalClassification.STRENGTH,
        ),
        trainingExperience: TrainingExperienceLevel.INTERMEDIATE,
        sportId: null,
        availableEquipment: ["barbell", "bench"],
        trainingFrequency: 4,
        sessionDurationMinutes: 60,
        ...overrides,
    });
}

describe("Programme generation Goal", () => {
    it.each(Object.values(ProgrammeGoalClassification))(
        "accepts canonical classification %s",
        (classification) => {
            const goal = ProgrammeGenerationGoal.create(classification);
            expect(goal.classification).toBe(classification);
            expect(Object.isFrozen(goal)).toBe(true);
        },
    );

    it.each([
        "",
        "UNKNOWN",
        "general fitness",
        "General Fitness",
        "general-fitness",
        "FAT_LOSS",
        "RECOVERY",
        null,
        undefined,
    ])("rejects noncanonical classification %s", (classification) => {
        expect(() =>
            ProgrammeGenerationGoal.create(classification),
        ).toThrow("Programme goal classification is invalid.");
    });
});

describe("Programme generation input", () => {
    it.each(Object.values(TrainingExperienceLevel))(
        "accepts canonical experience %s",
        (trainingExperience) => {
            expect(
                createInput({ trainingExperience }).trainingExperience,
            ).toBe(trainingExperience);
        },
    );

    it.each(["", "EXPERT", "Intermediate", null, undefined])(
        "rejects invalid experience %s",
        (trainingExperience) => {
            expect(() => createInput({ trainingExperience })).toThrow(
                "Training experience level is invalid.",
            );
        },
    );

    it("requires and trims the Athlete ID", () => {
        expect(createInput({ athleteId: "  Athlete-A  " }).athleteId)
            .toBe("Athlete-A");

        for (const athleteId of ["", "  ", "undefined", "NULL", null]) {
            expect(() => createInput({ athleteId })).toThrow(
                "Athlete ID is required.",
            );
        }
    });

    it("normalizes an optional Sport ID", () => {
        expect(createInput({ sportId: undefined }).sportId).toBeNull();
        expect(createInput({ sportId: null }).sportId).toBeNull();
        expect(createInput({ sportId: "  " }).sportId).toBeNull();
        expect(createInput({ sportId: " Sport-A " }).sportId)
            .toBe("Sport-A");

        for (const sportId of ["undefined", "NULL", 42]) {
            expect(() => createInput({ sportId })).toThrow(
                "Sport ID is invalid.",
            );
        }
    });

    it("normalizes, deduplicates and sorts equipment", () => {
        const input = createInput({
            availableEquipment: [
                "  Dumbbell ",
                "BARBELL",
                "dumbbell",
                "ＢＥＮＣＨ",
            ],
        });

        expect(input.availableEquipment).toEqual([
            "barbell",
            "bench",
            "dumbbell",
        ]);
    });

    it("accepts an empty equipment set without treating it as a wildcard", () => {
        expect(createInput({ availableEquipment: [] }).availableEquipment)
            .toEqual([]);
    });

    it.each([
        "barbell",
        [""],
        ["  "],
        ["undefined"],
        ["NULL"],
        [42],
    ])("rejects invalid equipment %j", (availableEquipment) => {
        expect(() => createInput({ availableEquipment })).toThrow();
    });

    it("defensively protects equipment from source and returned mutations", () => {
        const source = ["barbell"];
        const input = createInput({ availableEquipment: source });

        source.push("bench");
        expect(input.availableEquipment).toEqual(["barbell"]);

        const returned = input.availableEquipment as string[];
        expect(() => returned.push("bench")).toThrow();
        expect(input.availableEquipment).toEqual(["barbell"]);
    });

    it.each([1, 4, 7])("accepts positive integer frequency %s", (value) => {
        expect(createInput({ trainingFrequency: value }).trainingFrequency)
            .toBe(value);
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        "rejects invalid frequency %s",
        (trainingFrequency) => {
            expect(() => createInput({ trainingFrequency })).toThrow(
                "Training frequency must be a finite positive integer.",
            );
        },
    );

    it.each([1, 30, 60])("accepts positive integer duration %s", (value) => {
        expect(
            createInput({ sessionDurationMinutes: value })
                .sessionDurationMinutes,
        ).toBe(value);
    });

    it.each([0, -1, 30.5, Number.NaN, Number.POSITIVE_INFINITY])(
        "rejects invalid duration %s",
        (sessionDurationMinutes) => {
            expect(() => createInput({ sessionDurationMinutes })).toThrow(
                "Session duration must be a finite positive integer.",
            );
        },
    );

    it("produces equivalent immutable canonical snapshots", () => {
        const first = createInput({
            athleteId: " Athlete-A ",
            sportId: " Sport-A ",
            availableEquipment: ["DUMBBELL", " barbell "],
        });
        const second = createInput({
            athleteId: "Athlete-A",
            sportId: "Sport-A",
            availableEquipment: ["barbell", "dumbbell", "BARBELL"],
        });

        expect(first.toSnapshot()).toEqual(second.toSnapshot());
        expect(Object.isFrozen(first.toSnapshot())).toBe(true);
        expect(Object.isFrozen(first.toSnapshot().availableEquipment))
            .toBe(true);
        expect(first.toSnapshot()).not.toHaveProperty("target");
        expect(first.toSnapshot()).not.toHaveProperty("horizon");
        expect(first.toSnapshot()).not.toHaveProperty("targetDate");
    });
});

describe("Generate Workout Programme internal command", () => {
    it("carries trimmed server-authoritative context and structured input", () => {
        const input = createInput();
        const command = new GenerateWorkoutProgrammeCommand(
            " tenant-id ",
            " actor-id ",
            input,
        );

        expect(command.tenantId).toBe("tenant-id");
        expect(command.actorUserId).toBe("actor-id");
        expect(command.input).toBe(input);
        expect(Object.isFrozen(command)).toBe(true);
        expect(command).not.toHaveProperty("execute");
    });

    it.each([
        ["", "actor-id", "Tenant ID is required."],
        ["undefined", "actor-id", "Tenant ID is required."],
        ["tenant-id", "", "Actor user ID is required."],
        ["tenant-id", "NULL", "Actor user ID is required."],
    ])(
        "rejects invalid authoritative context",
        (tenantId, actorUserId, message) => {
            expect(() => new GenerateWorkoutProgrammeCommand(
                tenantId,
                actorUserId,
                createInput(),
            )).toThrow(message);
        },
    );

    it("requires the structured generation input", () => {
        expect(() => new GenerateWorkoutProgrammeCommand(
            "tenant-id",
            "actor-id",
            null as unknown as ProgrammeGenerationInput,
        )).toThrow("Programme generation input is required.");
    });
});

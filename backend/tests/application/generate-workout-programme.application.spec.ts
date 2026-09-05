import { describe, expect, it, vi } from "vitest";

import { GenerateWorkoutProgrammeCommand } from "../../src/application/commands/generate-workout-programme.command";
import { GenerateWorkoutProgrammeRequest } from "../../src/application/commands/generate-workout-programme-request";
import { GenerateWorkoutProgrammeUseCase } from "../../src/application/use-cases/generate-workout-programme.use-case";
import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { ProgrammeExercisePrescriptionCandidate } from "../../src/domain/value-objects/programme-exercise-prescription-candidate.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { ProgrammeGenerationInput } from "../../src/domain/value-objects/programme-generation-input.value-object";

function command(actor = "actor-1") {
    return new GenerateWorkoutProgrammeCommand(
        "tenant-1",
        actor,
        ProgrammeGenerationInput.create({
            athleteId: "athlete-1",
            goal: ProgrammeGenerationGoal.create(ProgrammeGoalClassification.STRENGTH),
            trainingExperience: TrainingExperienceLevel.BEGINNER,
            sportId: "sport-1",
            availableEquipment: [],
            trainingFrequency: 1,
            sessionDurationMinutes: 10,
        }),
    );
}

function candidate() {
    return ProgrammeExercisePrescriptionCandidate.fromProfile(
        "exercise-1",
        ExercisePrescriptionProfile.restore(
            "profile-1", "tenant-1", "exercise-1",
            ProgrammeGoalClassification.STRENGTH,
            TrainingExperienceLevel.BEGINNER,
            1, ExercisePrescriptionMode.REPETITIONS,
            2, 8, null, 30, 20, RecordStatus.ACTIVE,
            new Date(0), new Date(0),
        ),
    );
}

function harness(overrides: {
    athlete?: unknown;
    sport?: unknown;
    candidates?: readonly ProgrammeExercisePrescriptionCandidate[];
} = {}) {
    const athleteRepository = {
        findById: vi.fn().mockResolvedValue(
            overrides.athlete === undefined
                ? { isActive: () => true }
                : overrides.athlete,
        ),
    };
    const sportRepository = {
        findById: vi.fn().mockResolvedValue(
            overrides.sport === undefined
                ? { isActive: () => true }
                : overrides.sport,
        ),
    };
    const candidateRepository = {
        findReadyForProgramme: vi.fn().mockResolvedValue(
            overrides.candidates ?? [candidate()],
        ),
    };
    const transaction = {
        execute: vi.fn().mockResolvedValue({ status: "created" }),
    };
    const useCase = new GenerateWorkoutProgrammeUseCase(
        athleteRepository as never,
        sportRepository as never,
        candidateRepository,
        transaction as never,
    );
    return { useCase, athleteRepository, sportRepository, candidateRepository, transaction };
}

describe("Generate Workout Programme application boundary", () => {
    it.each(["", "bad key", "a".repeat(201), "*"])(
        "rejects invalid idempotency key %j",
        key => expect(() => new GenerateWorkoutProgrammeRequest(command(), key))
            .toThrow("Idempotency key is invalid."),
    );

    it("normalizes an approved idempotency key", () => {
        expect(new GenerateWorkoutProgrammeRequest(command(), " key:1 ").idempotencyKey)
            .toBe("key:1");
    });

    it.each([
        [null],
        [{ isActive: () => false }],
    ])("fails closed for unavailable Athlete", async athlete => {
        const { useCase, transaction } = harness({ athlete });
        await expect(useCase.execute(new GenerateWorkoutProgrammeRequest(
            command(), "key-1",
        ))).rejects.toThrow("Generation input is unavailable.");
        expect(transaction.execute).not.toHaveBeenCalled();
    });

    it.each([
        [null],
        [{ isActive: () => false }],
    ])("fails closed for unavailable Sport", async sport => {
        const { useCase, transaction } = harness({ sport });
        await expect(useCase.execute(new GenerateWorkoutProgrammeRequest(
            command(), "key-1",
        ))).rejects.toThrow("Generation input is unavailable.");
        expect(transaction.execute).not.toHaveBeenCalled();
    });

    it("passes immutable released-rule inputs and fingerprints to one transaction", async () => {
        const { useCase, candidateRepository, transaction } = harness();
        const result = await useCase.execute(new GenerateWorkoutProgrammeRequest(
            command(), "key-1",
        ));

        expect(result).toEqual({ status: "created" });
        expect(candidateRepository.findReadyForProgramme).toHaveBeenCalledOnce();
        expect(transaction.execute).toHaveBeenCalledOnce();
        const input = transaction.execute.mock.calls[0][0];
        expect(input).toEqual(expect.objectContaining({
            tenantId: "tenant-1",
            actorUserId: "actor-1",
            idempotencyKey: "key-1",
            requestFingerprintVersion: "1",
            ruleset: expect.objectContaining({
                id: "TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION",
                version: "1.0.0",
            }),
        }));
        expect(input.requestFingerprint).toMatch(/^[0-9a-f]{64}$/u);
        expect(input.planFingerprint).toMatch(/^[0-9a-f]{64}$/u);
        expect(Object.isFrozen(input)).toBe(true);
        expect(Object.isFrozen(input.candidates)).toBe(true);
    });

    it("includes actor authority in the request fingerprint", async () => {
        const first = harness();
        const second = harness();
        await first.useCase.execute(new GenerateWorkoutProgrammeRequest(
            command("actor-1"), "same-key",
        ));
        await second.useCase.execute(new GenerateWorkoutProgrammeRequest(
            command("actor-2"), "same-key",
        ));
        expect(first.transaction.execute.mock.calls[0][0].requestFingerprint)
            .not.toBe(second.transaction.execute.mock.calls[0][0].requestFingerprint);
    });

    it("propagates candidate repository infrastructure failure", async () => {
        const data = harness();
        data.candidateRepository.findReadyForProgramme.mockRejectedValueOnce(
            new Error("database unavailable"),
        );
        await expect(data.useCase.execute(new GenerateWorkoutProgrammeRequest(
            command(), "key-1",
        ))).rejects.toThrow("database unavailable");
    });

    it("does not reinterpret generation failure", async () => {
        const { useCase, transaction } = harness({ candidates: [] });
        await expect(useCase.execute(new GenerateWorkoutProgrammeRequest(
            command(), "key-1",
        ))).rejects.toThrow("No prescription-ready Exercises are available.");
        expect(transaction.execute).not.toHaveBeenCalled();
    });
});

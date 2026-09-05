import { describe, expect, it } from "vitest";

import { GenerateWorkoutProgrammeCommand } from "../../src/application/commands/generate-workout-programme.command";
import { ProgrammeGenerationFingerprintService } from "../../src/application/services/programme-generation-fingerprint.service";
import { ExercisePrescriptionProfile } from "../../src/domain/entities/exercise-prescription-profile.entity";
import { WorkoutProgrammeGeneration } from "../../src/domain/entities/workout-programme-generation.entity";
import { ExercisePrescriptionMode } from "../../src/domain/enums/exercise-prescription-mode.enum";
import { ProgrammeGoalClassification } from "../../src/domain/enums/programme-goal-classification.enum";
import { RecordStatus } from "../../src/domain/enums/record-status.enum";
import { TrainingExperienceLevel } from "../../src/domain/enums/training-experience-level.enum";
import { DeterministicProgrammeGenerationService } from "../../src/domain/services/deterministic-programme-generation.service";
import { ProgrammeExercisePrescriptionCandidate } from "../../src/domain/value-objects/programme-exercise-prescription-candidate.value-object";
import { ProgrammeGenerationGoal } from "../../src/domain/value-objects/programme-generation-goal.value-object";
import { ProgrammeGenerationInput } from "../../src/domain/value-objects/programme-generation-input.value-object";
import { ProgrammeGenerationRuleset } from "../../src/domain/value-objects/programme-generation-ruleset.value-object";

function command(actorUserId = "actor-1") {
    return new GenerateWorkoutProgrammeCommand(
        "tenant-1",
        actorUserId,
        ProgrammeGenerationInput.create({
            athleteId: "athlete-1",
            goal: ProgrammeGenerationGoal.create(
                ProgrammeGoalClassification.STRENGTH,
            ),
            trainingExperience: TrainingExperienceLevel.BEGINNER,
            sportId: null,
            availableEquipment: ["bands", "barbell"],
            trainingFrequency: 1,
            sessionDurationMinutes: 10,
        }),
    );
}

function plan() {
    const profile = ExercisePrescriptionProfile.restore(
        "profile-1", "tenant-1", "exercise-1",
        ProgrammeGoalClassification.STRENGTH,
        TrainingExperienceLevel.BEGINNER,
        1,
        ExercisePrescriptionMode.REPETITIONS,
        2, 8, null, 30, 20,
        RecordStatus.ACTIVE,
        new Date(0), new Date(0),
    );
    const candidate = ProgrammeExercisePrescriptionCandidate.fromProfile(
        "exercise-1",
        profile,
    );
    return DeterministicProgrammeGenerationService.generate(
        command().input,
        [candidate],
        ProgrammeGenerationRuleset.v1(),
    );
}

describe("Programme generation fingerprints", () => {
    it("produces a stable canonical request vector", () => {
        const result = ProgrammeGenerationFingerprintService.request(
            command(), ProgrammeGenerationRuleset.v1(),
        );
        expect(result.canonicalJson).toBe(
            '{"fingerprintVersion":"1","tenantId":"tenant-1","actorUserId":"actor-1","athleteId":"athlete-1","goalClassification":"STRENGTH","trainingExperience":"BEGINNER","sportId":null,"availableEquipment":["bands","barbell"],"trainingFrequency":1,"sessionDurationMinutes":10,"rulesetId":"TITAN_HEALTH_INITIAL_PROGRAMME_GENERATION","rulesetVersion":"1.0.0"}',
        );
        expect(result.fingerprint).toBe(
            "1608c255042006ccddd8554f108cb3ab7caf67f3ffc3b1d93d348d5b77b11ecd",
        );
        expect(result).toEqual(ProgrammeGenerationFingerprintService.request(
            command(), ProgrammeGenerationRuleset.v1(),
        ));
    });

    it("validates and preserves immutable provenance state", () => {
        const inputSnapshot = { athleteId: "athlete-1", equipment: ["bands"] };
        const created = new Date(0);
        const generation = WorkoutProgrammeGeneration.restore(
            "generation-1", " tenant-1 ", "programme-1", "actor-1", " key-1 ",
            "a".repeat(64), "1", "b".repeat(64), "rules", "1.0.0",
            inputSnapshot, { sessions: [] }, created,
        );
        inputSnapshot.equipment.push("barbell");
        created.setTime(1000);

        expect(generation.tenantId).toBe("tenant-1");
        expect(generation.idempotencyKey).toBe("key-1");
        expect(generation.inputSnapshot).toEqual({
            athleteId: "athlete-1",
            equipment: ["bands"],
        });
        const exposedDate = generation.createdAt;
        exposedDate.setTime(2000);
        expect(generation.createdAt.valueOf()).toBe(0);
        expect(Object.isFrozen(generation.inputSnapshot)).toBe(true);
    });

    it.each([
        ["blank authority", { tenantId: " " }],
        ["semantic authority", { actorUserId: "undefined" }],
        ["invalid key", { idempotencyKey: "bad key" }],
        ["long key", { idempotencyKey: "a".repeat(201) }],
        ["invalid request hash", { requestFingerprint: "A".repeat(64) }],
        ["invalid plan hash", { planFingerprint: "short" }],
        ["invalid version", { requestFingerprintVersion: "2" }],
        ["blank ruleset", { rulesetVersion: " " }],
        ["unsafe snapshot", { inputSnapshot: { count: Number.MAX_SAFE_INTEGER + 1 } }],
    ])("rejects %s at the domain boundary", (_name, override) => {
        const base = {
            tenantId: "tenant-1",
            programmeId: "programme-1",
            actorUserId: "actor-1",
            idempotencyKey: "key-1",
            requestFingerprint: "a".repeat(64),
            requestFingerprintVersion: "1",
            planFingerprint: "b".repeat(64),
            rulesetId: "rules",
            rulesetVersion: "1.0.0",
            inputSnapshot: { athleteId: "athlete-1" },
            planSnapshot: { sessions: [] },
        };
        expect(() => WorkoutProgrammeGeneration.create({ ...base, ...override }))
            .toThrow();
    });

    it("includes actor authority and excludes idempotency data", () => {
        const first = ProgrammeGenerationFingerprintService.request(
            command("actor-1"), ProgrammeGenerationRuleset.v1(),
        );
        const second = ProgrammeGenerationFingerprintService.request(
            command("actor-2"), ProgrammeGenerationRuleset.v1(),
        );
        expect(first.fingerprint).not.toBe(second.fingerprint);
        expect(first.canonicalJson).not.toContain("idempotency");
    });

    it("captures the complete ordered generated plan deterministically", () => {
        const first = ProgrammeGenerationFingerprintService.plan(
            plan(), ProgrammeGenerationRuleset.v1(),
        );
        const second = ProgrammeGenerationFingerprintService.plan(
            plan(), ProgrammeGenerationRuleset.v1(),
        );
        expect(first).toEqual(second);
        expect(first.canonicalJson).toContain('"profileId":"profile-1"');
        expect(first.canonicalJson).toContain('"approximateDurationSeconds":70');
        expect(first.fingerprint).toMatch(/^[0-9a-f]{64}$/u);
    });

    it("returns immutable snapshots", () => {
        const result = ProgrammeGenerationFingerprintService.plan(
            plan(), ProgrammeGenerationRuleset.v1(),
        );
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.snapshot)).toBe(true);
        const sessions = (result.snapshot as { sessions: readonly unknown[] }).sessions;
        expect(Object.isFrozen(sessions)).toBe(true);
        expect(Object.isFrozen(sessions[0])).toBe(true);
    });

    it("rejects mismatched rulesets", () => {
        const generated = plan();
        const foreign = Object.create(ProgrammeGenerationRuleset.prototype) as ProgrammeGenerationRuleset;
        Object.assign(foreign, { id: "foreign", version: "1" });
        expect(() => ProgrammeGenerationFingerprintService.plan(generated, foreign))
            .toThrow("Generated Programme ruleset does not match.");
    });
});

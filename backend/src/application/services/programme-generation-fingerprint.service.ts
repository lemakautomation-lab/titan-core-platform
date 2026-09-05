import { createHash } from "crypto";

import { GenerateWorkoutProgrammeCommand } from "../commands/generate-workout-programme.command";
import {
    ImmutableJsonValue,
} from "../../domain/entities/workout-programme-generation.entity";
import { GeneratedProgrammePlan } from "../../domain/value-objects/generated-programme-plan.value-object";
import { ProgrammeGenerationRuleset } from "../../domain/value-objects/programme-generation-ruleset.value-object";

export interface ProgrammeGenerationFingerprint {
    readonly fingerprint: string;
    readonly fingerprintVersion: "1";
    readonly canonicalJson: string;
    readonly snapshot: ImmutableJsonValue;
}

export class ProgrammeGenerationFingerprintService {
    static readonly FINGERPRINT_VERSION = "1" as const;

    static request(
        command: GenerateWorkoutProgrammeCommand,
        ruleset: ProgrammeGenerationRuleset,
    ): ProgrammeGenerationFingerprint {
        if (!(command instanceof GenerateWorkoutProgrammeCommand)) {
            throw new Error("Programme generation command is required.");
        }
        this.requireRuleset(ruleset);

        const input = command.input.toSnapshot();
        this.requireCanonicalStringOrder(
            input.availableEquipment,
            "Available equipment",
        );

        return this.create({
            fingerprintVersion: this.FINGERPRINT_VERSION,
            tenantId: command.tenantId,
            actorUserId: command.actorUserId,
            athleteId: input.athleteId,
            goalClassification: input.goalClassification,
            trainingExperience: input.trainingExperience,
            sportId: input.sportId,
            availableEquipment: [...input.availableEquipment],
            trainingFrequency: this.requireSafeInteger(
                input.trainingFrequency,
                "Training frequency",
            ),
            sessionDurationMinutes: this.requireSafeInteger(
                input.sessionDurationMinutes,
                "Session duration",
            ),
            rulesetId: ruleset.id,
            rulesetVersion: ruleset.version,
        });
    }

    static plan(
        plan: GeneratedProgrammePlan,
        ruleset: ProgrammeGenerationRuleset,
    ): ProgrammeGenerationFingerprint {
        if (!(plan instanceof GeneratedProgrammePlan)) {
            throw new Error("Generated Programme plan is required.");
        }
        this.requireRuleset(ruleset);
        if (
            plan.rulesetId !== ruleset.id ||
            plan.rulesetVersion !== ruleset.version
        ) {
            throw new Error("Generated Programme ruleset does not match.");
        }

        const sessions = plan.sessions.map((session, sessionIndex) => {
            if (session.ordinal !== sessionIndex + 1) {
                throw new Error("Generated session order is noncanonical.");
            }
            const prescriptions = session.prescriptions.map(
                (prescription, prescriptionIndex) => {
                    if (prescription.ordinal !== prescriptionIndex + 1) {
                        throw new Error(
                            "Generated prescription order is noncanonical.",
                        );
                    }
                    return {
                        ordinal: this.requireSafeInteger(
                            prescription.ordinal,
                            "Prescription ordinal",
                        ),
                        exerciseId: prescription.exerciseId,
                        profileId: prescription.profileId,
                        profileVersion: this.requireSafeInteger(
                            prescription.profileVersion,
                            "Profile version",
                        ),
                        prescriptionMode: prescription.prescriptionMode,
                        sets: this.requireSafeInteger(prescription.sets, "Sets"),
                        repetitions: prescription.repetitions,
                        durationSeconds: prescription.durationSeconds,
                        restSeconds: this.requireSafeInteger(
                            prescription.restSeconds,
                            "Rest seconds",
                        ),
                        estimatedSetDurationSeconds:
                            prescription.estimatedSetDurationSeconds,
                        approximatePrescriptionSeconds: this.requireSafeInteger(
                            prescription.approximatePrescriptionSeconds,
                            "Approximate prescription seconds",
                        ),
                    };
                },
            );

            return {
                ordinal: this.requireSafeInteger(session.ordinal, "Session ordinal"),
                name: session.name,
                approximateDurationSeconds: this.requireSafeInteger(
                    session.approximateDurationSeconds,
                    "Approximate session duration",
                ),
                prescriptions,
            };
        });

        return this.create({
            fingerprintVersion: this.FINGERPRINT_VERSION,
            rulesetId: ruleset.id,
            rulesetVersion: ruleset.version,
            athleteId: plan.athleteId,
            goalClassification: plan.goalClassification,
            trainingExperience: plan.trainingExperience,
            sportId: plan.sportId,
            trainingFrequency: this.requireSafeInteger(
                plan.trainingFrequency,
                "Training frequency",
            ),
            sessionDurationMinutes: this.requireSafeInteger(
                plan.sessionDurationMinutes,
                "Session duration",
            ),
            name: plan.name,
            description: plan.description,
            legacyGoal: plan.legacyGoal,
            legacyExperience: plan.legacyExperience,
            sessions,
        });
    }

    private static create(
        snapshot: Record<string, ImmutableJsonValue>,
    ): ProgrammeGenerationFingerprint {
        this.assertJson(snapshot);
        const canonicalJson = JSON.stringify(snapshot);
        const fingerprint = createHash("sha256")
            .update(canonicalJson, "utf8")
            .digest("hex");
        return Object.freeze({
            fingerprint,
            fingerprintVersion: this.FINGERPRINT_VERSION,
            canonicalJson,
            snapshot: this.cloneAndFreeze(snapshot),
        });
    }

    private static requireRuleset(value: unknown): asserts value is ProgrammeGenerationRuleset {
        if (!(value instanceof ProgrammeGenerationRuleset)) {
            throw new Error("Generation ruleset is required.");
        }
    }

    private static requireCanonicalStringOrder(
        values: readonly string[],
        field: string,
    ): void {
        const expected = [...new Set(values)].sort();
        if (JSON.stringify(values) !== JSON.stringify(expected)) {
            throw new Error(`${field} order is noncanonical.`);
        }
    }

    private static requireSafeInteger(value: unknown, field: string): number {
        if (typeof value !== "number" || !Number.isSafeInteger(value)) {
            throw new Error(`${field} must be a safe integer.`);
        }
        return value;
    }

    private static assertJson(value: unknown): void {
        if (value === null || typeof value === "string" || typeof value === "boolean") {
            return;
        }
        if (typeof value === "number") {
            if (!Number.isSafeInteger(value)) {
                throw new Error("Fingerprint snapshot contains an unsafe number.");
            }
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(item => this.assertJson(item));
            return;
        }
        if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
            Object.values(value as Record<string, unknown>)
                .forEach(item => this.assertJson(item));
            return;
        }
        throw new Error("Fingerprint snapshot is not JSON-compatible.");
    }

    private static cloneAndFreeze(value: ImmutableJsonValue): ImmutableJsonValue {
        if (Array.isArray(value)) {
            return Object.freeze(value.map(item => this.cloneAndFreeze(item)));
        }
        if (value !== null && typeof value === "object") {
            const source = value as {
                readonly [key: string]: ImmutableJsonValue;
            };
            const copy: Record<string, ImmutableJsonValue> = {};
            for (const key of Object.keys(source)) {
                copy[key] = this.cloneAndFreeze(source[key]);
            }
            return Object.freeze(copy);
        }
        return value;
    }
}

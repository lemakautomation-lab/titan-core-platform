import { GeneratedProgrammePrescriptionPlan } from "./generated-programme-prescription-plan.value-object";

export class GeneratedProgrammeSessionPlan {
    private readonly orderedPrescriptions:
        readonly GeneratedProgrammePrescriptionPlan[];

    private constructor(
        public readonly ordinal: number,
        public readonly name: string,
        prescriptions: readonly GeneratedProgrammePrescriptionPlan[],
        public readonly approximateDurationSeconds: number,
    ) {
        this.orderedPrescriptions = Object.freeze([...prescriptions]);
        Object.freeze(this);
    }

    static create(
        ordinal: unknown,
        name: unknown,
        prescriptions: readonly GeneratedProgrammePrescriptionPlan[],
        durationLimitSeconds: unknown,
    ): GeneratedProgrammeSessionPlan {
        if (!Number.isSafeInteger(ordinal) || (ordinal as number) < 1) {
            throw new Error("Session ordinal must be a positive safe integer.");
        }
        if (typeof name !== "string" || !name.trim()) {
            throw new Error("Session name is required.");
        }
        if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
            throw new Error("Generated session requires at least one prescription.");
        }
        if (
            !Number.isSafeInteger(durationLimitSeconds) ||
            (durationLimitSeconds as number) < 1
        ) {
            throw new Error("Session duration limit must be a positive safe integer.");
        }

        let total = 0;
        const exerciseIds = new Set<string>();
        const prescriptionOrdinals = new Set<number>();

        for (const prescription of prescriptions) {
            if (!(prescription instanceof GeneratedProgrammePrescriptionPlan)) {
                throw new Error("Generated prescription plan is invalid.");
            }
            if (exerciseIds.has(prescription.exerciseId)) {
                throw new Error("An Exercise cannot repeat within a session.");
            }
            if (prescriptionOrdinals.has(prescription.ordinal)) {
                throw new Error("Prescription ordinals must be unique.");
            }
            total = this.checkedAdd(
                total,
                prescription.approximatePrescriptionSeconds,
            );
            exerciseIds.add(prescription.exerciseId);
            prescriptionOrdinals.add(prescription.ordinal);
        }

        if (total > (durationLimitSeconds as number)) {
            throw new Error("Generated session exceeds its duration limit.");
        }

        const ordered = [...prescriptions].sort(
            (left, right) => left.ordinal - right.ordinal,
        );
        for (let index = 0; index < ordered.length; index += 1) {
            if (ordered[index].ordinal !== index + 1) {
                throw new Error(
                    "Generated prescription ordinals must be contiguous.",
                );
            }
        }

        return new GeneratedProgrammeSessionPlan(
            ordinal as number,
            name.trim(),
            ordered,
            total,
        );
    }

    get prescriptions(): readonly GeneratedProgrammePrescriptionPlan[] {
        return Object.freeze([...this.orderedPrescriptions]);
    }

    private static checkedAdd(left: number, right: number): number {
        if (!Number.isSafeInteger(right) || right < 1) {
            throw new Error("Prescription duration must be a positive safe integer.");
        }
        const result = left + right;
        if (!Number.isSafeInteger(result)) {
            throw new Error("Generation duration arithmetic overflow.");
        }
        return result;
    }
}

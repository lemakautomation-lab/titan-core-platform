import { randomUUID } from "crypto";

import { WorkoutProgrammeExercisePrescription } from "./workout-programme-exercise-prescription.entity";

export class WorkoutProgrammeSession {
    private readonly orderedPrescriptions:
        readonly WorkoutProgrammeExercisePrescription[];

    private constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly programmeId: string,
        public readonly ordinal: number,
        public readonly name: string,
        prescriptions: readonly WorkoutProgrammeExercisePrescription[],
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {
        this.orderedPrescriptions = Object.freeze([...prescriptions]);
        Object.freeze(this);
    }

    static create(
        tenantId: string,
        programmeId: string,
        ordinal: number,
        name: string,
        prescriptions: readonly WorkoutProgrammeExercisePrescription[] = [],
    ): WorkoutProgrammeSession {
        const now = new Date();

        return this.restore(
            randomUUID(),
            tenantId,
            programmeId,
            ordinal,
            name,
            prescriptions,
            now,
            now,
        );
    }

    static restore(
        id: string,
        tenantId: string,
        programmeId: string,
        ordinal: number,
        name: string,
        prescriptions: readonly WorkoutProgrammeExercisePrescription[],
        createdAt: Date,
        updatedAt: Date,
    ): WorkoutProgrammeSession {
        this.requireIdentifier(id, "Session ID");
        this.requireIdentifier(tenantId, "Tenant ID");
        this.requireIdentifier(programmeId, "Programme ID");

        if (!Number.isInteger(ordinal) || ordinal < 1) {
            throw new Error("Session ordinal must be a positive integer.");
        }

        if (typeof name !== "string" || !name.trim()) {
            throw new Error("Session name is required.");
        }

        const ordered = [...prescriptions].sort(
            (left, right) => left.ordinal - right.ordinal,
        );
        const ordinals = new Set<number>();

        for (const prescription of ordered) {
            if (
                prescription.tenantId !== tenantId.trim() ||
                prescription.sessionId !== id.trim()
            ) {
                throw new Error(
                    "Prescription ownership does not match its session.",
                );
            }

            if (ordinals.has(prescription.ordinal)) {
                throw new Error(
                    "Prescription ordinals must be unique within a session.",
                );
            }

            ordinals.add(prescription.ordinal);
        }

        return new WorkoutProgrammeSession(
            id.trim(),
            tenantId.trim(),
            programmeId.trim(),
            ordinal,
            name.trim(),
            ordered,
            createdAt,
            updatedAt,
        );
    }

    get prescriptions(): readonly WorkoutProgrammeExercisePrescription[] {
        return Object.freeze([...this.orderedPrescriptions]);
    }

    private static requireIdentifier(value: string, field: string): void {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${field} is required.`);
        }
    }
}

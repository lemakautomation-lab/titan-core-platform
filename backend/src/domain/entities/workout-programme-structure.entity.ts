import { WorkoutProgrammeSession } from "./workout-programme-session.entity";

export class WorkoutProgrammeStructure {
    private readonly orderedSessions: readonly WorkoutProgrammeSession[];

    private constructor(
        public readonly tenantId: string,
        public readonly programmeId: string,
        sessions: readonly WorkoutProgrammeSession[],
    ) {
        this.orderedSessions = Object.freeze([...sessions]);
        Object.freeze(this);
    }

    static create(
        tenantId: string,
        programmeId: string,
        sessions: readonly WorkoutProgrammeSession[],
    ): WorkoutProgrammeStructure {
        return this.build(tenantId, programmeId, sessions, true);
    }

    static restore(
        tenantId: string,
        programmeId: string,
        sessions: readonly WorkoutProgrammeSession[],
    ): WorkoutProgrammeStructure {
        return this.build(tenantId, programmeId, sessions, false);
    }

    private static build(
        tenantId: string,
        programmeId: string,
        sessions: readonly WorkoutProgrammeSession[],
        requireCompleteStructure: boolean,
    ): WorkoutProgrammeStructure {
        if (typeof tenantId !== "string" || !tenantId.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (typeof programmeId !== "string" || !programmeId.trim()) {
            throw new Error("Programme ID is required.");
        }

        if (!Array.isArray(sessions)) {
            throw new Error("Programme sessions must be an array.");
        }

        if (requireCompleteStructure && sessions.length === 0) {
            throw new Error(
                "Initial Programme structure requires at least one session.",
            );
        }

        const normalizedTenantId = tenantId.trim();
        const normalizedProgrammeId = programmeId.trim();
        const ordered = [...sessions].sort(
            (left, right) => left.ordinal - right.ordinal,
        );
        const ordinals = new Set<number>();

        for (const session of ordered) {
            if (
                session.tenantId !== normalizedTenantId ||
                session.programmeId !== normalizedProgrammeId
            ) {
                throw new Error(
                    "Session ownership does not match its programme.",
                );
            }

            if (ordinals.has(session.ordinal)) {
                throw new Error(
                    "Session ordinals must be unique within a programme.",
                );
            }

            if (
                requireCompleteStructure &&
                session.prescriptions.length === 0
            ) {
                throw new Error(
                    "Initial Programme sessions require at least one prescription.",
                );
            }

            ordinals.add(session.ordinal);
        }

        return new WorkoutProgrammeStructure(
            normalizedTenantId,
            normalizedProgrammeId,
            ordered,
        );
    }

    get sessions(): readonly WorkoutProgrammeSession[] {
        return Object.freeze([...this.orderedSessions]);
    }
}

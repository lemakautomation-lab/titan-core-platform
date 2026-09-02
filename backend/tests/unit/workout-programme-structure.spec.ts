import { describe, expect, it } from "vitest";

import { WorkoutProgrammeExercisePrescription } from "../../src/domain/entities/workout-programme-exercise-prescription.entity";
import { WorkoutProgrammeSession } from "../../src/domain/entities/workout-programme-session.entity";
import { WorkoutProgrammeStructure } from "../../src/domain/entities/workout-programme-structure.entity";

function prescription(
    sessionId: string,
    ordinal: number,
    overrides: {
        tenantId?: string;
        repetitions?: number | null;
        durationSeconds?: number | null;
        sets?: number;
        restSeconds?: number | null;
    } = {},
) {
    return WorkoutProgrammeExercisePrescription.create(
        overrides.tenantId ?? "tenant-1",
        sessionId,
        "exercise-1",
        ordinal,
        overrides.sets ?? 3,
        overrides.repetitions === undefined ? 10 : overrides.repetitions,
        overrides.durationSeconds ?? null,
        overrides.restSeconds === undefined ? 60 : overrides.restSeconds,
    );
}

describe("Workout Programme structure domain", () => {
    it("creates an immutable named session with a UUID and one-based order", () => {
        const session = WorkoutProgrammeSession.create(
            "tenant-1",
            "programme-1",
            1,
            "  Foundation  ",
        );

        expect(session.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(session.name).toBe("Foundation");
        expect(session.ordinal).toBe(1);
        expect(Object.isFrozen(session)).toBe(true);
    });

    it.each([0, -1, 1.5])("rejects invalid session ordinal %s", ordinal => {
        expect(() => WorkoutProgrammeSession.create(
            "tenant-1",
            "programme-1",
            ordinal,
            "Session",
        )).toThrow("Session ordinal must be a positive integer.");
    });

    it.each(["", "  "])("rejects blank session name", name => {
        expect(() => WorkoutProgrammeSession.create(
            "tenant-1",
            "programme-1",
            1,
            name,
        )).toThrow("Session name is required.");
    });

    it("supports immutable repetitions and duration prescription modes", () => {
        const repetitions = prescription("session-1", 1);
        const duration = prescription("session-1", 2, {
            repetitions: null,
            durationSeconds: 45,
            restSeconds: 0,
        });

        expect(repetitions.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(repetitions.repetitions).toBe(10);
        expect(duration.durationSeconds).toBe(45);
        expect(Object.isFrozen(repetitions)).toBe(true);
        expect(Object.isFrozen(duration)).toBe(true);
    });

    it.each([
        { repetitions: null, durationSeconds: null },
        { repetitions: 10, durationSeconds: 30 },
    ])("enforces exactly one prescription mode", mode => {
        expect(() => prescription("session-1", 1, mode)).toThrow(
            "Prescription requires exactly one repetitions or duration mode.",
        );
    });

    it.each([0, -1, 1.5])("rejects invalid sets %s", sets => {
        expect(() => prescription("session-1", 1, { sets })).toThrow(
            "Prescription sets must be a positive integer.",
        );
    });

    it.each([-1, 1.5])("rejects invalid rest %s", restSeconds => {
        expect(() => prescription("session-1", 1, { restSeconds })).toThrow(
            "Prescription rest must be a non-negative integer.",
        );
    });

    it("sorts sessions and prescriptions deterministically", () => {
        const sessionId = "session-1";
        const session = WorkoutProgrammeSession.restore(
            sessionId,
            "tenant-1",
            "programme-1",
            2,
            "Second",
            [prescription(sessionId, 3), prescription(sessionId, 1)],
            new Date(),
            new Date(),
        );
        const firstSessionId = "session-2";
        const first = WorkoutProgrammeSession.restore(
            firstSessionId,
            "tenant-1",
            "programme-1",
            1,
            "First",
            [prescription(firstSessionId, 1)],
            new Date(),
            new Date(),
        );
        const structure = WorkoutProgrammeStructure.create(
            "tenant-1",
            "programme-1",
            [session, first],
        );

        expect(structure.sessions.map(item => item.ordinal)).toEqual([1, 2]);
        expect(session.prescriptions.map(item => item.ordinal)).toEqual([1, 3]);
        expect(Object.isFrozen(structure.sessions)).toBe(true);
        expect(Object.isFrozen(session.prescriptions)).toBe(true);
    });

    it("rejects duplicate session ordinals", () => {
        const sessions = ["A", "B"].map((name, index) => {
            const sessionId = `session-${index + 1}`;
            return WorkoutProgrammeSession.restore(
                sessionId,
                "tenant-1",
                "programme-1",
                1,
                name,
                [prescription(sessionId, 1)],
                new Date(),
                new Date(),
            );
        });

        expect(() => WorkoutProgrammeStructure.create(
            "tenant-1",
            "programme-1",
            sessions,
        )).toThrow("Session ordinals must be unique within a programme.");
    });

    it("rejects duplicate prescription ordinals", () => {
        const sessionId = "session-1";

        expect(() => WorkoutProgrammeSession.restore(
            sessionId,
            "tenant-1",
            "programme-1",
            1,
            "Session",
            [prescription(sessionId, 1), prescription(sessionId, 1)],
            new Date(),
            new Date(),
        )).toThrow(
            "Prescription ordinals must be unique within a session.",
        );
    });

    it("rejects child ownership inconsistent with the hierarchy", () => {
        const foreignPrescription = prescription("session-1", 1, {
            tenantId: "tenant-2",
        });

        expect(() => WorkoutProgrammeSession.restore(
            "session-1",
            "tenant-1",
            "programme-1",
            1,
            "Session",
            [foreignPrescription],
            new Date(),
            new Date(),
        )).toThrow("Prescription ownership does not match its session.");
    });

    it("requires non-empty initial sessions and prescriptions", () => {
        expect(() => WorkoutProgrammeStructure.create(
            "tenant-1",
            "programme-1",
            [],
        )).toThrow(
            "Initial Programme structure requires at least one session.",
        );

        expect(() => WorkoutProgrammeStructure.create(
            "tenant-1",
            "programme-1",
            [WorkoutProgrammeSession.create(
                "tenant-1",
                "programme-1",
                1,
                "Empty session",
            )],
        )).toThrow(
            "Initial Programme sessions require at least one prescription.",
        );
    });
});

import { describe, expect, it } from "vitest";

import {
    WorkoutProgrammeProgressionService,
} from "../../src/domain/services/workout-programme-progression.service";

describe("WorkoutProgrammeProgressionService", () => {
    const service = new WorkoutProgrammeProgressionService();

    it("progresses an active programme when evidence is sufficient and performance improved", () => {
        expect(
            service.decide({
                programmeStatus: "ACTIVE",
                performanceImproved: true,
                evidenceSufficient: true,
            }),
        ).toEqual({
            decision: "PROGRESS",
            trainingFrequencyDelta: 0,
            sessionDurationMinutesDelta: 5,
        });
    });

    it("holds when performance has not improved", () => {
        expect(
            service.decide({
                programmeStatus: "ACTIVE",
                performanceImproved: false,
                evidenceSufficient: true,
            }),
        ).toEqual({
            decision: "HOLD",
            trainingFrequencyDelta: 0,
            sessionDurationMinutesDelta: 0,
        });
    });

    it("holds when evidence is insufficient", () => {
        expect(
            service.decide({
                programmeStatus: "ACTIVE",
                performanceImproved: true,
                evidenceSufficient: false,
            }),
        ).toEqual({
            decision: "HOLD",
            trainingFrequencyDelta: 0,
            sessionDurationMinutesDelta: 0,
        });
    });

    it("holds inactive programmes", () => {
        expect(
            service.decide({
                programmeStatus: "INACTIVE",
                performanceImproved: true,
                evidenceSufficient: true,
            }),
        ).toEqual({
            decision: "HOLD",
            trainingFrequencyDelta: 0,
            sessionDurationMinutesDelta: 0,
        });
    });

    it("rejects a missing programme status", () => {
        expect(() =>
            service.decide({
                programmeStatus: "",
                performanceImproved: true,
                evidenceSufficient: true,
            }),
        ).toThrow("Programme status is required.");
    });
});

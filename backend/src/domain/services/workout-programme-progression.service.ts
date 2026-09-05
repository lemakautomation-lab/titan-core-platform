export type WorkoutProgrammeProgressionDecision =
    | {
        decision: "PROGRESS";
        trainingFrequencyDelta: 0 | 1;
        sessionDurationMinutesDelta: 0 | 5;
    }
    | {
        decision: "HOLD";
        trainingFrequencyDelta: 0;
        sessionDurationMinutesDelta: 0;
    };

export interface WorkoutProgrammeProgressionInput {
    programmeStatus: string;
    performanceImproved: boolean;
    evidenceSufficient: boolean;
}

export class WorkoutProgrammeProgressionService {
    decide(
        input: WorkoutProgrammeProgressionInput,
    ): WorkoutProgrammeProgressionDecision {

        if (
            typeof input.programmeStatus !== "string" ||
            !input.programmeStatus.trim()
        ) {
            throw new Error("Programme status is required.");
        }

        if (input.programmeStatus !== "ACTIVE") {
            return {
                decision: "HOLD",
                trainingFrequencyDelta: 0,
                sessionDurationMinutesDelta: 0,
            };
        }

        if (!input.evidenceSufficient) {
            return {
                decision: "HOLD",
                trainingFrequencyDelta: 0,
                sessionDurationMinutesDelta: 0,
            };
        }

        if (!input.performanceImproved) {
            return {
                decision: "HOLD",
                trainingFrequencyDelta: 0,
                sessionDurationMinutesDelta: 0,
            };
        }

        return {
            decision: "PROGRESS",
            trainingFrequencyDelta: 0,
            sessionDurationMinutesDelta: 5,
        };
    }
}

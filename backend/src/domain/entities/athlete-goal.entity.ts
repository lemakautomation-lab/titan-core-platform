import { randomUUID } from "crypto";

import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";

export const ATHLETE_GOAL_CLASSIFICATIONS =
    Object.freeze(
        Object.values(
            ProgrammeGoalClassification,
        ),
    );

export class AthleteGoal {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly athleteId: string,
        public readonly classification:
            ProgrammeGoalClassification,
        public readonly isPrimary: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        athleteId: string,
        classification: unknown,
        isPrimary: boolean,
    ): AthleteGoal {

        if (
            typeof classification !== "string" ||
            !ATHLETE_GOAL_CLASSIFICATIONS.includes(
                classification as ProgrammeGoalClassification,
            )
        ) {
            throw new Error(
                "Athlete goal classification is invalid.",
            );
        }

        const now = new Date();

        return new AthleteGoal(
            randomUUID(),
            tenantId,
            athleteId,
            classification as ProgrammeGoalClassification,
            isPrimary,
            now,
            now,
        );
    }

    static validateSelection(
        primaryGoal: unknown,
        secondaryGoals: readonly unknown[],
    ): Readonly<{
        primaryGoal: ProgrammeGoalClassification;
        secondaryGoals: ProgrammeGoalClassification[];
    }> {

        const primary = AthleteGoal.create(
            "validation",
            "validation",
            primaryGoal,
            true,
        ).classification;

        const secondary = secondaryGoals.map(
            (classification) =>
                AthleteGoal.create(
                    "validation",
                    "validation",
                    classification,
                    false,
                ).classification,
        );

        if (new Set(secondary).size !== secondary.length) {
            throw new Error(
                "Secondary athlete goals must be unique.",
            );
        }

        if (secondary.includes(primary)) {
            throw new Error(
                "Primary athlete goal cannot also be secondary.",
            );
        }

        return Object.freeze({
            primaryGoal: primary,
            secondaryGoals: secondary.sort(
                (left, right) =>
                    ATHLETE_GOAL_CLASSIFICATIONS.indexOf(left) -
                    ATHLETE_GOAL_CLASSIFICATIONS.indexOf(right),
            ),
        });
    }
}

import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";

export class ProgrammeGenerationGoal {
    private constructor(
        public readonly classification: ProgrammeGoalClassification,
    ) {
        Object.freeze(this);
    }

    static create(
        classification: unknown,
    ): ProgrammeGenerationGoal {
        if (
            typeof classification !== "string" ||
            !Object.values(ProgrammeGoalClassification).includes(
                classification as ProgrammeGoalClassification,
            )
        ) {
            throw new Error(
                "Programme goal classification is invalid.",
            );
        }

        return new ProgrammeGenerationGoal(
            classification as ProgrammeGoalClassification,
        );
    }
}

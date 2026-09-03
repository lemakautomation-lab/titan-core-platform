import { Exercise } from "../entities/exercise.entity";
import { ProgrammeGoalClassification } from "../enums/programme-goal-classification.enum";
import { RecordStatus } from "../enums/record-status.enum";
import { TrainingExperienceLevel } from "../enums/training-experience-level.enum";
import { ProgrammeExerciseEligibilityCriteria } from "../value-objects/programme-exercise-eligibility-criteria.value-object";

const difficultyLevel: Readonly<Record<TrainingExperienceLevel, number>> = {
    [TrainingExperienceLevel.BEGINNER]: 1,
    [TrainingExperienceLevel.INTERMEDIATE]: 2,
    [TrainingExperienceLevel.ADVANCED]: 3,
};

export class ProgrammeExerciseEligibilityService {
    static filter(
        criteria: ProgrammeExerciseEligibilityCriteria,
        exercises: readonly Exercise[],
    ): Exercise[] {
        const available = new Set(criteria.availableEquipment);

        return exercises
            .filter(exercise =>
                this.isEligible(criteria, exercise, available),
            )
            .sort((left, right) =>
                left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
            );
    }

    private static isEligible(
        criteria: ProgrammeExerciseEligibilityCriteria,
        exercise: Exercise,
        available: ReadonlySet<string>,
    ): boolean {
        if (
            exercise.tenantId !== criteria.tenantId ||
            exercise.status !== RecordStatus.ACTIVE
        ) {
            return false;
        }

        if (criteria.sportId === null) {
            if (exercise.sportId !== null) {
                return false;
            }
        } else if (
            exercise.sportId !== null &&
            exercise.sportId !== criteria.sportId
        ) {
            return false;
        }

        const difficulty = this.normalizeControlledValue(
            exercise.difficulty,
        ) as TrainingExperienceLevel | null;

        if (
            difficulty === null ||
            !(difficulty in difficultyLevel) ||
            difficultyLevel[difficulty] >
                difficultyLevel[criteria.trainingExperience]
        ) {
            return false;
        }

        const objective = this.normalizeControlledValue(
            exercise.trainingObjective,
        ) as ProgrammeGoalClassification | null;

        if (
            objective === null ||
            !Object.values(ProgrammeGoalClassification).includes(objective) ||
            objective !== criteria.goal.classification
        ) {
            return false;
        }

        const requiredEquipment = this.normalizeExerciseEquipment(
            exercise.equipment,
        );

        return requiredEquipment !== null &&
            requiredEquipment.every(item => available.has(item));
    }

    private static normalizeControlledValue(value: unknown): string | null {
        if (typeof value !== "string") {
            return null;
        }

        const normalized = value
            .normalize("NFKC")
            .trim()
            .replace(/\s+/gu, " ")
            .replace(/[ -]+/gu, "_")
            .toLocaleUpperCase("en-US");

        if (
            !normalized ||
            normalized === "NULL" ||
            normalized === "UNDEFINED"
        ) {
            return null;
        }

        return normalized;
    }

    private static normalizeExerciseEquipment(
        value: unknown,
    ): string[] | null {
        if (!Array.isArray(value)) {
            return null;
        }

        const normalized: string[] = [];

        for (const item of value) {
            if (typeof item !== "string") {
                return null;
            }

            const equipment = item
                .normalize("NFKC")
                .trim()
                .replace(/\s+/gu, " ")
                .toLocaleLowerCase("en-US");

            if (
                !equipment ||
                equipment === "null" ||
                equipment === "undefined"
            ) {
                return null;
            }

            normalized.push(equipment);
        }

        return [...new Set(normalized)].sort();
    }
}

import { ExerciseRepository } from "../../domain/repositories/exercise.repository";
import { ProgrammeExercisePrescriptionCandidateRepository } from "../../domain/repositories/programme-exercise-prescription-candidate.repository";
import { ProgrammeExercisePrescriptionReadinessService } from "../../domain/services/programme-exercise-prescription-readiness.service";
import { ProgrammeExerciseEligibilityCriteria } from "../../domain/value-objects/programme-exercise-eligibility-criteria.value-object";
import { ProgrammeExercisePrescriptionCandidate } from "../../domain/value-objects/programme-exercise-prescription-candidate.value-object";
import { DatabaseService } from "../database/database.service";
import { ExercisePrescriptionProfileMapper } from "../mappers/exercise-prescription-profile.mapper";

export class PrismaProgrammeExercisePrescriptionCandidateRepository
implements ProgrammeExercisePrescriptionCandidateRepository {
    constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly database: DatabaseService,
    ) {}

    async findReadyForProgramme(
        criteria: ProgrammeExerciseEligibilityCriteria,
    ): Promise<readonly ProgrammeExercisePrescriptionCandidate[]> {
        const eligibleExercises =
            await this.exerciseRepository.findEligibleForProgramme(criteria);

        if (eligibleExercises.length === 0) {
            return Object.freeze([]);
        }

        const profiles = await this.database.prisma
            .exercisePrescriptionProfile.findMany({
                where: {
                    tenantId: criteria.tenantId,
                    exerciseId: {
                        in: eligibleExercises.map(exercise => exercise.id),
                    },
                    goalClassification: criteria.goal.classification,
                    trainingExperience: criteria.trainingExperience,
                    status: "ACTIVE",
                },
                orderBy: [
                    { exerciseId: "asc" },
                    { id: "asc" },
                ],
            });

        return ProgrammeExercisePrescriptionReadinessService.createCandidates(
            criteria,
            eligibleExercises,
            profiles.map(ExercisePrescriptionProfileMapper.toDomain),
        );
    }
}

import { Result } from "../common/result";
import { GetStrengthConditioningWorkflowQuery } from "../queries/performance-professional/get-strength-conditioning-workflow.query";
import { StrengthConditioningWorkflowDto } from "../dto/performance-professional/strength-conditioning-workflow.dto";
import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { TrainingStressRepository } from "../../domain/repositories/training-stress.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class GetStrengthConditioningWorkflowUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly trainingStressRepository: TrainingStressRepository,
        private readonly workoutProgrammeRepository: WorkoutProgrammeRepository,
    ) {}

    async execute(
        query: Readonly<GetStrengthConditioningWorkflowQuery>,
    ): Promise<Result<StrengthConditioningWorkflowDto>> {
        if (
            !Number.isInteger(query.limit) ||
            query.limit < 1 ||
            query.limit > 100
        ) {
            return Result.failure(
                "Workflow limit must be an integer between 1 and 100.",
            );
        }

        const athlete = await this.athleteRepository.findById(
            query.athleteId,
            query.tenantId,
        );

        if (!athlete) {
            return Result.failure("Athlete not found.");
        }

        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                query.athleteId,
                query.userId,
                AthleteRelationshipType.PERFORMANCE_PROFESSIONAL,
                query.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Performance Professional athlete relationship is required.",
            );
        }

        const [trainingStress, workoutProgrammes] = await Promise.all([
            this.trainingStressRepository.listRecentForAthlete(
                query.tenantId,
                query.athleteId,
                query.limit,
            ),
            this.workoutProgrammeRepository.findAllByAthleteId(
                query.athleteId,
                query.tenantId,
            ),
        ]);

        return Result.success({
            athleteId: query.athleteId,
            trainingStress: trainingStress.map(observation => ({
                id: observation.id,
                athleteId: observation.athleteId,
                value: observation.value,
                recordedAt: observation.recordedAt.toISOString(),
                createdAt: observation.createdAt.toISOString(),
                sourceType: observation.sourceType,
                sourceId: observation.sourceId,
                sourceObservationId: observation.sourceObservationId,
            })),
            workoutProgrammes: workoutProgrammes.map(
                WorkoutProgrammeApplicationMapper.toDto,
            ),
        });
    }
}

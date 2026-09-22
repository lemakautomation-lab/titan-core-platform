import { Result } from "../common/result";
import { RehabilitationProfessionalWorkflowDto } from "../dto/performance-professional/rehabilitation-professional-workflow.dto";
import { GetRehabilitationProfessionalWorkflowQuery } from "../queries/performance-professional/get-rehabilitation-professional-workflow.query";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { RecoveryTrackingRepository } from "../../domain/repositories/recovery-tracking/recovery-tracking.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class GetRehabilitationProfessionalWorkflowUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly recoveryTrackingRepository: RecoveryTrackingRepository,
    ) {}

    async execute(
        query: Readonly<GetRehabilitationProfessionalWorkflowQuery>,
    ): Promise<Result<RehabilitationProfessionalWorkflowDto>> {
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

        const recovery =
            await this.recoveryTrackingRepository.listRecentForAthlete(
                query.tenantId,
                query.athleteId,
                query.limit,
            );

        return Result.success({
            athleteId: query.athleteId,
            recovery: recovery.map(observation => ({
                id: observation.id,
                athleteId: observation.athleteId,
                value: observation.value,
                recordedAt: observation.recordedAt.toISOString(),
                createdAt: observation.createdAt.toISOString(),
                sourceType: observation.sourceType,
                sourceId: observation.sourceId,
                sourceObservationId:
                    observation.sourceObservationId,
            })),
        });
    }
}

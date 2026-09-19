import { Result } from "../common/result";
import { TrainerClientProfileDto } from "../dto/trainer/trainer-client-profile.dto";
import { GetTrainerClientProfileQuery } from "../queries/trainer/get-trainer-client-profile.query";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class GetTrainerClientProfileUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly trainerAccess: GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        query: Readonly<GetTrainerClientProfileQuery>,
    ): Promise<Result<TrainerClientProfileDto>> {
        const access =
            await this.trainerAccess.execute({
                userId: query.userId,
                tenantId: query.tenantId,
            });

        if (
            !access.isSuccess ||
            !access.value?.accessGranted
        ) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        const athlete =
            await this.athleteRepository.findById(
                query.athleteId,
                query.tenantId,
            );

        if (!athlete) {
            return Result.failure(
                "Athlete not found.",
            );
        }

        const relationship =
            await this.relationshipRepository
                .findByAthleteAndRelatedEntity(
                    query.athleteId,
                    query.userId,
                    AthleteRelationshipType.TRAINER,
                    query.tenantId,
                );

        if (
            !relationship ||
            !relationship.isActive()
        ) {
            return Result.failure(
                "Active Trainer client relationship is required.",
            );
        }

        return Result.success({
            athleteId: athlete.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            countryCode: athlete.countryCode,
            status: athlete.status,
            relationshipId: relationship.id,
            relationshipStatus:
                relationship.status,
            relationshipStartsAt:
                relationship.startsAt,
        });
    }
}

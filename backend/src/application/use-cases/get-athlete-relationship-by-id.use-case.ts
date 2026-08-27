import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";

import { AthleteRelationshipDto } from "../dto/athlete-relationship/athlete-relationship.dto";
import { AthleteRelationshipApplicationMapper } from "../mappers/athlete-relationship.mapper";

import { GetAthleteRelationshipByIdQuery } from "../queries/athlete-relationship/get-athlete-relationship-by-id.query";

export class GetAthleteRelationshipByIdUseCase
implements UseCase<GetAthleteRelationshipByIdQuery, Result<AthleteRelationshipDto>> {

    constructor(
        private readonly athleteRelationshipRepository: AthleteRelationshipRepository,
    ) {}

    async execute(
        query: GetAthleteRelationshipByIdQuery,
    ): Promise<Result<AthleteRelationshipDto>> {

        const relationship =
            await this.athleteRelationshipRepository.findById(
                query.id,
                query.tenantId,
            );

        if (!relationship) {

            return Result.failure(
                "Athlete relationship not found.",
            );
        }

        return Result.success(
            AthleteRelationshipApplicationMapper.toDto(
                relationship,
            ),
        );
    }

}

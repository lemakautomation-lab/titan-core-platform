import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";

import { AthleteRelationshipDto } from "../dto/athlete-relationship/athlete-relationship.dto";
import { AthleteRelationshipApplicationMapper } from "../mappers/athlete-relationship.mapper";

import { ListAthleteRelationshipsQuery } from "../queries/athlete-relationship/list-athlete-relationships.query";

export class ListAthleteRelationshipsUseCase
implements UseCase<ListAthleteRelationshipsQuery, Result<AthleteRelationshipDto[]>> {

    constructor(
        private readonly athleteRelationshipRepository: AthleteRelationshipRepository,
    ) {}

    async execute(
        query: ListAthleteRelationshipsQuery,
    ): Promise<Result<AthleteRelationshipDto[]>> {

        const relationships =
            await this.athleteRelationshipRepository.findAllByAthleteId(
                query.athleteId,
                query.tenantId,
            );

        return Result.success(
            relationships.map(
                (relationship) =>
                    AthleteRelationshipApplicationMapper.toDto(
                        relationship,
                    ),
            ),
        );
    }

}

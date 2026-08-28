import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";

import { AthleteRelationshipDto } from "../dto/athlete-relationship/athlete-relationship.dto";
import { AthleteRelationshipApplicationMapper } from "../mappers/athlete-relationship.mapper";

import { ListAthleteRelationshipsQuery } from "../queries/athlete-relationship/list-athlete-relationships.query";

import {
    createPaginationMeta,
    PaginatedResult,
} from "../common/pagination";

export class ListAthleteRelationshipsUseCase
implements UseCase<
    ListAthleteRelationshipsQuery,
    Result<PaginatedResult<AthleteRelationshipDto>>
> {

    constructor(
        private readonly athleteRelationshipRepository:
            AthleteRelationshipRepository,
    ) {}

    async execute(
        query: ListAthleteRelationshipsQuery,
    ): Promise<
        Result<PaginatedResult<AthleteRelationshipDto>>
    > {

        const result =
            await this.athleteRelationshipRepository.findAllByAthleteId(
                query.athleteId,
                query.tenantId,
                {
                    page: query.page,
                    pageSize: query.pageSize,
                },
            );

        return Result.success({
            data: result.items.map(
                (relationship) =>
                    AthleteRelationshipApplicationMapper.toDto(
                        relationship,
                    ),
            ),
            pagination:
                createPaginationMeta(
                    query.page,
                    query.pageSize,
                    result.total,
                ),
        });
    }
}

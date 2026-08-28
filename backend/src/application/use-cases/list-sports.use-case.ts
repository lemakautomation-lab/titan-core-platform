import { SportRepository } from "../../domain/repositories/sport.repository";

import { ListSportsQuery } from "../queries/sport/list-sports.query";

import { SportDto } from "../dto/sport/sport.dto";

import {
    PaginatedResult,
    createPaginationMeta,
} from "../common/pagination";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

import { SportApplicationMapper } from "../mappers/sport.mapper";

export class ListSportsUseCase
implements UseCase<ListSportsQuery, Result<PaginatedResult<SportDto>>>
{

    constructor(

        private readonly sportRepository: SportRepository,

    ) {}

    async execute(
        query: ListSportsQuery,
    ): Promise<Result<PaginatedResult<SportDto>>> {

        const result =
            await this.sportRepository.findAll(
                query.tenantId,
                {
                    page:
                        query.page,

                    pageSize:
                        query.pageSize,
                },
            );

        return Result.success({

            data:
                result.items.map(
                    SportApplicationMapper.toDto,
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

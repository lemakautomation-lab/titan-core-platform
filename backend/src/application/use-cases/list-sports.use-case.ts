import { SportRepository } from "../../domain/repositories/sport.repository";

import { ListSportsQuery } from "../queries/sport/list-sports.query";

import { SportDto } from "../dto/sport/sport.dto";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

import { SportApplicationMapper } from "../mappers/sport.mapper";

export class ListSportsUseCase
implements UseCase<ListSportsQuery, Result<SportDto[]>>
{

    constructor(

        private readonly sportRepository: SportRepository,

    ) {}

    async execute(
        query: ListSportsQuery,
    ): Promise<Result<SportDto[]>> {

        const sports =
            await this.sportRepository.findAll(
                query.tenantId,
            );

        return Result.success(

            sports.map(
                SportApplicationMapper.toDto,
            ),

        );

    }

}

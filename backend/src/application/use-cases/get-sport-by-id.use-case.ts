import { SportRepository } from "../../domain/repositories/sport.repository";

import { GetSportByIdQuery } from "../queries/sport/get-sport-by-id.query";

import { SportDto } from "../dto/sport/sport.dto";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

import { SportApplicationMapper } from "../mappers/sport.mapper";

export class GetSportByIdUseCase
implements UseCase<GetSportByIdQuery, Result<SportDto>>
{

    constructor(

        private readonly sportRepository: SportRepository,

    ) {}

    async execute(
        query: GetSportByIdQuery,
    ): Promise<Result<SportDto>> {

        const sport =
            await this.sportRepository.findById(
                query.id,
                query.tenantId,
            );

        if (!sport) {

            return Result.failure(
                "Sport not found.",
            );

        }

        return Result.success(

            SportApplicationMapper.toDto(
                sport,
            ),

        );

    }

}

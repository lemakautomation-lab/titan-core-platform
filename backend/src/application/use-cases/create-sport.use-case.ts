import { Sport } from "../../domain/entities/sport.entity";

import { SportRepository } from "../../domain/repositories/sport.repository";

import { CreateSportCommand } from "../commands/create-sport.command";

import { SportDto } from "../dto/sport/sport.dto";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

import { SportApplicationMapper } from "../mappers/sport.mapper";

export class CreateSportUseCase
implements UseCase<CreateSportCommand, Result<SportDto>>
{

    constructor(

        private readonly sportRepository: SportRepository,

    ) {}

    async execute(
        command: CreateSportCommand,
    ): Promise<Result<SportDto>> {

        const existingSport =
            await this.sportRepository.findBySlug(
                command.slug,
                command.tenantId,
            );

        if (existingSport) {

            return Result.failure(
                "Sport already exists.",
            );

        }

        const sport =
            Sport.create(

                command.tenantId,

                command.name,

                command.slug,

            );

        await this.sportRepository.create(
            sport,
        );

        return Result.success(

            SportApplicationMapper.toDto(
                sport,
            ),

        );

    }

}

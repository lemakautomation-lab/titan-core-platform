import { SportRepository } from "../../domain/repositories/sport.repository";

import { UpdateSportCommand } from "../commands/update-sport.command";

import { SportDto } from "../dto/sport/sport.dto";

import { Result } from "../common/result";

import { UseCase } from "../common/use-case.interface";

import { SportApplicationMapper } from "../mappers/sport.mapper";

export class UpdateSportUseCase
implements UseCase<UpdateSportCommand, Result<SportDto>>
{

    constructor(

        private readonly sportRepository: SportRepository,

    ) {}

    async execute(
        command: UpdateSportCommand,
    ): Promise<Result<SportDto>> {

        const sport =
            await this.sportRepository.findById(
                command.id,
                command.tenantId,
            );

        if (!sport) {

            return Result.failure(
                "Sport not found.",
            );

        }

        const existingSport =
            await this.sportRepository.findBySlug(
                command.slug,
                command.tenantId,
            );

        if (
            existingSport &&
            existingSport.id !== sport.id
        ) {

            return Result.failure(
                "Sport already exists.",
            );

        }

        sport.updateDetails(
            command.name,
            command.slug,
        );

        const updated =
            await this.sportRepository.update(
                sport,
                command.tenantId,
            );

        return Result.success(

            SportApplicationMapper.toDto(
                updated,
            ),

        );

    }

}

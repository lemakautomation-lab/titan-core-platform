import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteDigitalTwinRepository } from "../../domain/repositories/athlete-digital-twin.repository";
import { AthleteDigitalTwin } from "../../domain/entities/athlete-digital-twin.entity";

import { AthleteDigitalTwinDto } from "../dto/athlete-digital-twin/athlete-digital-twin.dto";
import { CreateAthleteDigitalTwinCommand } from "../commands/create-athlete-digital-twin.command";

import { AthleteDigitalTwinApplicationMapper } from "../mappers/athlete-digital-twin.mapper";

export class CreateAthleteDigitalTwinUseCase
implements UseCase<CreateAthleteDigitalTwinCommand, Result<AthleteDigitalTwinDto>> {

    constructor(
        private readonly athleteDigitalTwinRepository: AthleteDigitalTwinRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        command: CreateAthleteDigitalTwinCommand,
    ): Promise<Result<AthleteDigitalTwinDto>> {

        const athlete =
            await this.athleteRepository.findById(
                command.athleteId,
                command.tenantId,
            );

        if (!athlete) {

            return Result.failure(
                "Athlete not found.",
            );
        }

        const existing =
            await this.athleteDigitalTwinRepository.findByAthleteId(
                command.athleteId,
                command.tenantId,
            );

        if (existing) {

            return Result.failure(
                "Athlete Digital Twin already exists.",
            );
        }

        const twin =
            AthleteDigitalTwin.create(
                command.tenantId,
                command.athleteId,
            );

        const created =
            await this.athleteDigitalTwinRepository.create(
                twin,
            );

        return Result.success(
            AthleteDigitalTwinApplicationMapper.toDto(
                created,
            ),
        );
    }

}

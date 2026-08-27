import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationship } from "../../domain/entities/athlete-relationship.entity";

import { AthleteRelationshipDto } from "../dto/athlete-relationship/athlete-relationship.dto";
import { CreateAthleteRelationshipCommand } from "../commands/create-athlete-relationship.command";

import { AthleteRelationshipApplicationMapper } from "../mappers/athlete-relationship.mapper";

export class CreateAthleteRelationshipUseCase
implements UseCase<CreateAthleteRelationshipCommand, Result<AthleteRelationshipDto>> {

    constructor(
        private readonly athleteRelationshipRepository: AthleteRelationshipRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        command: CreateAthleteRelationshipCommand,
    ): Promise<Result<AthleteRelationshipDto>> {

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

        const relationship =
            AthleteRelationship.create(
                command.tenantId,
                command.athleteId,
                command.relationshipType,
                command.relatedEntityId,
                command.startsAt,
            );

        const created =
            await this.athleteRelationshipRepository.create(
                relationship,
            );

        return Result.success(
            AthleteRelationshipApplicationMapper.toDto(
                created,
            ),
        );
    }

}

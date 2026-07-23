import { randomUUID } from "crypto";

import { UseCase } from "../common/use-case.interface";
import { Result } from "../common/result";

import { OrganisationRepository } from "../../domain/repositories/organisation.repository";
import { Organisation } from "../../domain/entities/organisation.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";

import { OrganisationDto } from "../dto/organisation/organisation.dto";
import { CreateOrganisationCommand } from "../commands/create-organisation.command";

import { OrganisationApplicationMapper } from "../mappers/organisation.mapper";

export class CreateOrganisationUseCase
    implements UseCase<CreateOrganisationCommand, Result<OrganisationDto>>
{
    constructor(
        private readonly organisationRepository: OrganisationRepository,
    ) {}

    async execute(
        command: CreateOrganisationCommand,
    ): Promise<Result<OrganisationDto>> {

        const slug = command.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const organisation = new Organisation(
            randomUUID(),
            command.tenantId,
            command.name,
            slug,
            RecordStatus.ACTIVE,
            new Date(),
            new Date(),
        );

        await this.organisationRepository.create(
            organisation,
        );

        return Result.success(
            OrganisationApplicationMapper.toDto(
                organisation,
            ),
        );

    }

}

import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { OrganisationRepository } from "../../domain/repositories/organisation.repository";

import { OrganisationDto } from "../dto/organisation/organisation.dto";

import { UpdateOrganisationCommand } from "../commands/update-organisation.command";

import { OrganisationApplicationMapper } from "../mappers/organisation.mapper";


export class UpdateOrganisationUseCase
implements UseCase<UpdateOrganisationCommand, Result<OrganisationDto>>
{


    constructor(

        private readonly organisationRepository: OrganisationRepository,

    ) {}



    async execute(

        command: UpdateOrganisationCommand,

    ): Promise<Result<OrganisationDto>> {


        const organisation =
            await this.organisationRepository.findById(
                command.id,
            );


        if (!organisation) {

            return Result.failure(
                "Organisation not found.",
            );

        }


        organisation.updateDetails(

            command.name,

            command.slug,

        );


        const updatedOrganisation =
            await this.organisationRepository.update(
                organisation,
            );


        return Result.success(

            OrganisationApplicationMapper.toDto(
                updatedOrganisation,
            ),

        );

    }

}

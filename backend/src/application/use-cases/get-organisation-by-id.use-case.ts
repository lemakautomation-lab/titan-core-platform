import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { OrganisationRepository } from "../../domain/repositories/organisation.repository";

import { OrganisationDto } from "../dto/organisation/organisation.dto";

import { GetOrganisationByIdQuery } from "../queries/organisation/get-organisation-by-id.query";

import { OrganisationApplicationMapper } from "../mappers/organisation.mapper";


export class GetOrganisationByIdUseCase
    implements UseCase<GetOrganisationByIdQuery, Result<OrganisationDto>>
{

    constructor(
        private readonly organisationRepository: OrganisationRepository,
    ) {}


    async execute(
        query: GetOrganisationByIdQuery,
    ): Promise<Result<OrganisationDto>> {


        const organisation =
            await this.organisationRepository.findById(
                query.id,
            );


        if (!organisation) {

            return Result.failure(
                "Organisation not found.",
            );

        }


        return Result.success(
            OrganisationApplicationMapper.toDto(
                organisation,
            ),
        );

    }

}

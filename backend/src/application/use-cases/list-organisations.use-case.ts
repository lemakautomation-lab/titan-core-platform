import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { OrganisationRepository } from "../../domain/repositories/organisation.repository";

import { OrganisationDto } from "../dto/organisation/organisation.dto";

import { OrganisationApplicationMapper } from "../mappers/organisation.mapper";

import { ListOrganisationsQuery } from "../queries/organisation/list-organisations.query";


export class ListOrganisationsUseCase
implements UseCase<ListOrganisationsQuery, Result<OrganisationDto[]>>
{


    constructor(
        private readonly organisationRepository: OrganisationRepository,
    ) {}



    async execute(
        query: ListOrganisationsQuery,
    ): Promise<Result<OrganisationDto[]>> {


        void query;


        const organisations =
            await this.organisationRepository.findAll();



        return Result.success(

            organisations.map(
                (organisation) =>
                    OrganisationApplicationMapper.toDto(
                        organisation,
                    ),
            ),

        );

    }

}

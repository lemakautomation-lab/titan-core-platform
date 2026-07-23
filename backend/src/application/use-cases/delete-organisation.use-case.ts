import { UseCase } from "../common/use-case.interface";

import { Result } from "../common/result";

import { OrganisationRepository } from "../../domain/repositories/organisation.repository";

import { DeleteOrganisationCommand } from "../commands/delete-organisation.command";


export class DeleteOrganisationUseCase
implements UseCase<DeleteOrganisationCommand, Result<void>>
{


    constructor(

        private readonly organisationRepository: OrganisationRepository,

    ) {}



    async execute(

        command: DeleteOrganisationCommand,

    ): Promise<Result<void>> {


        const organisation =
            await this.organisationRepository.findById(
                command.id,
            );


        if (!organisation) {

            return Result.failure(
                "Organisation not found.",
            );

        }


        await this.organisationRepository.delete(
            command.id,
        );


        return Result.success(
            undefined,
        );

    }

}

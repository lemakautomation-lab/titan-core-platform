import { Request, Response } from "express";

import { CreateOrganisationCommand } from "../../application/commands/create-organisation.command";

import { CreateOrganisationUseCase } from "../../application/use-cases/create-organisation.use-case";


export class OrganisationController {

    constructor(
        private readonly createOrganisationUseCase: CreateOrganisationUseCase,
    ) {}


    async create(
        req: Request,
        res: Response,
    ): Promise<void> {


        const command =
            new CreateOrganisationCommand(
                req.body.tenantId,
                req.body.name,
            );


        const result =
            await this.createOrganisationUseCase.execute(
                command,
            );


        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;
        }


        res.status(201).json(
            result.value,
        );

    }

}

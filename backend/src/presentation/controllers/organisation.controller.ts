import { Request, Response } from "express";

import { CreateOrganisationCommand } from "../../application/commands/create-organisation.command";
import { UpdateOrganisationCommand } from "../../application/commands/update-organisation.command";
import { DeleteOrganisationCommand } from "../../application/commands/delete-organisation.command";

import { GetOrganisationByIdQuery } from "../../application/queries/organisation/get-organisation-by-id.query";
import { ListOrganisationsQuery } from "../../application/queries/organisation/list-organisations.query";

import { CreateOrganisationUseCase } from "../../application/use-cases/create-organisation.use-case";
import { GetOrganisationByIdUseCase } from "../../application/use-cases/get-organisation-by-id.use-case";
import { ListOrganisationsUseCase } from "../../application/use-cases/list-organisations.use-case";
import { UpdateOrganisationUseCase } from "../../application/use-cases/update-organisation.use-case";
import { DeleteOrganisationUseCase } from "../../application/use-cases/delete-organisation.use-case";


export class OrganisationController {


    constructor(

        private readonly createOrganisationUseCase: CreateOrganisationUseCase,

        private readonly getOrganisationByIdUseCase: GetOrganisationByIdUseCase,

        private readonly listOrganisationsUseCase: ListOrganisationsUseCase,

        private readonly updateOrganisationUseCase: UpdateOrganisationUseCase,

        private readonly deleteOrganisationUseCase: DeleteOrganisationUseCase,

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
            await this.createOrganisationUseCase.execute(command);

        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;
        }

        res.status(201).json(result.value);

    }



    async getById(
        req: Request,
        res: Response,
    ): Promise<void> {

        const query =
            new GetOrganisationByIdQuery(
                String(req.params.id),
            );

        const result =
            await this.getOrganisationByIdUseCase.execute(query);

        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;
        }

        res.status(200).json(result.value);

    }



    async list(
        req: Request,
        res: Response,
    ): Promise<void> {

        const result =
            await this.listOrganisationsUseCase.execute(
                new ListOrganisationsQuery(),
            );

        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;
        }

        res.status(200).json(result.value);

    }



    async update(
        req: Request,
        res: Response,
    ): Promise<void> {


        const slug =
            req.body.name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");



        const command =
            new UpdateOrganisationCommand(

                String(req.params.id),

                req.body.name,

                slug,

            );



        const result =
            await this.updateOrganisationUseCase.execute(
                command,
            );


        if (!result.isSuccess) {

            res.status(400).json({
                error: result.error,
            });

            return;
        }


        res.status(200).json(result.value);

    }



    async delete(
        req: Request,
        res: Response,
    ): Promise<void> {


        const command =
            new DeleteOrganisationCommand(
                String(req.params.id),
            );


        const result =
            await this.deleteOrganisationUseCase.execute(
                command,
            );


        if (!result.isSuccess) {

            res.status(404).json({
                error: result.error,
            });

            return;
        }


        res.status(204).send();

    }


}

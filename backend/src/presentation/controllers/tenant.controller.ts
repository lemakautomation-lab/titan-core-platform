import { Request, Response, NextFunction } from "express";

import { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import { CreateTenantCommand } from "../../application/commands/tenant/create-tenant.command";

import { GetTenantByIdUseCase } from "../../application/use-cases/get-tenant-by-id.use-case";
import { GetTenantByIdQuery } from "../../application/queries/tenant/get-tenant-by-id.query";

import { ListTenantsUseCase } from "../../application/use-cases/list-tenants.use-case";
import { ListTenantsQuery } from "../../application/queries/tenant/list-tenants.query";


export class TenantController {

    constructor(
        private readonly createTenantUseCase: CreateTenantUseCase,

        private readonly getTenantByIdUseCase: GetTenantByIdUseCase,

        private readonly listTenantsUseCase: ListTenantsUseCase,
    ) {}


    async create(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {

        try {

            const command =
                new CreateTenantCommand(
                    req.body.name,
                );


            const result =
                await this.createTenantUseCase.execute(command);


            if (!result.isSuccess) {

                res.status(400).json({
                    message: result.error,
                });

                return;
            }


            res.status(201).json(
                result.value,
            );


        } catch (error) {

            next(error);

        }

    }


    async getById(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {

        try {

            const query =
                new GetTenantByIdQuery(
                    req.params.id as string,
                );


            const result =
                await this.getTenantByIdUseCase.execute(query);


            if (!result.isSuccess) {

                res.status(404).json({
                    message: result.error,
                });

                return;
            }


            res.status(200).json(
                result.value,
            );


        } catch (error) {

            next(error);

        }

    }


    async list(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {

        try {

            void req;

            const query =
                new ListTenantsQuery();


            const result =
                await this.listTenantsUseCase.execute(query);


            if (!result.isSuccess) {

                res.status(400).json({
                    message: result.error,
                });

                return;
            }


            res.status(200).json(
                result.value,
            );


        } catch (error) {

            next(error);

        }

    }

}
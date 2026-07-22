import { Request, Response, NextFunction } from "express";

import { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import { CreateTenantCommand } from "../../application/commands/tenant/create-tenant.command";


export class TenantController {

    constructor(
        private readonly createTenantUseCase: CreateTenantUseCase,
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

}
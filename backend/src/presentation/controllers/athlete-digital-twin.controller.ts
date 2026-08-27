import { Response } from "express";

import { CreateAthleteDigitalTwinCommand } from "../../application/commands/create-athlete-digital-twin.command";
import { UpdateAthleteDigitalTwinLifecycleCommand } from "../../application/commands/update-athlete-digital-twin-lifecycle.command";

import { GetAthleteDigitalTwinByIdQuery } from "../../application/queries/athlete-digital-twin/get-athlete-digital-twin-by-id.query";
import { GetAthleteDigitalTwinByAthleteIdQuery } from "../../application/queries/athlete-digital-twin/get-athlete-digital-twin-by-athlete-id.query";

import { CreateAthleteDigitalTwinUseCase } from "../../application/use-cases/create-athlete-digital-twin.use-case";
import { GetAthleteDigitalTwinByIdUseCase } from "../../application/use-cases/get-athlete-digital-twin-by-id.use-case";
import { GetAthleteDigitalTwinByAthleteIdUseCase } from "../../application/use-cases/get-athlete-digital-twin-by-athlete-id.use-case";
import { UpdateAthleteDigitalTwinLifecycleUseCase } from "../../application/use-cases/update-athlete-digital-twin-lifecycle.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";


export class AthleteDigitalTwinController {

    constructor(

        private readonly createAthleteDigitalTwinUseCase:
            CreateAthleteDigitalTwinUseCase,

        private readonly getAthleteDigitalTwinByIdUseCase:
            GetAthleteDigitalTwinByIdUseCase,

        private readonly getAthleteDigitalTwinByAthleteIdUseCase:
            GetAthleteDigitalTwinByAthleteIdUseCase,

        private readonly updateAthleteDigitalTwinLifecycleUseCase:
            UpdateAthleteDigitalTwinLifecycleUseCase,

    ) {}


    async create(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const command =
            new CreateAthleteDigitalTwinCommand(
                authUser.tenantId,
                String(req.body.athleteId),
            );

        const result =
            await this.createAthleteDigitalTwinUseCase.execute(
                command,
            );

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(201).json(result.value);
    }


    async getById(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const result =
            await this.getAthleteDigitalTwinByIdUseCase.execute(
                new GetAthleteDigitalTwinByIdQuery(
                    String(req.params.id),
                    authUser.tenantId,
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }


    async getByAthleteId(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const result =
            await this.getAthleteDigitalTwinByAthleteIdUseCase.execute(
                new GetAthleteDigitalTwinByAthleteIdQuery(
                    String(req.params.athleteId),
                    authUser.tenantId,
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }


    async updateLifecycle(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const result =
            await this.updateAthleteDigitalTwinLifecycleUseCase.execute(
                new UpdateAthleteDigitalTwinLifecycleCommand(
                    String(req.params.id),
                    authUser.tenantId,
                    req.body.action,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

}

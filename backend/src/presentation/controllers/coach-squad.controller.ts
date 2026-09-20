import { Response } from "express";

import { CreateCoachSquadCommand } from "../../application/commands/create-coach-squad.command";
import { UpdateCoachSquadCommand } from "../../application/commands/update-coach-squad.command";
import { ListCoachSquadsQuery } from "../../application/queries/coach/list-coach-squads.query";

import { CreateCoachSquadUseCase } from "../../application/use-cases/create-coach-squad.use-case";
import { ListCoachSquadsUseCase } from "../../application/use-cases/list-coach-squads.use-case";
import { UpdateCoachSquadUseCase } from "../../application/use-cases/update-coach-squad.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class CoachSquadController {
    constructor(
        private readonly createCoachSquadUseCase:
            CreateCoachSquadUseCase,
        private readonly listCoachSquadsUseCase:
            ListCoachSquadsUseCase,
        private readonly updateCoachSquadUseCase:
            UpdateCoachSquadUseCase,
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

        const result =
            await this.createCoachSquadUseCase.execute(
                new CreateCoachSquadCommand(
                    authUser.tenantId,
                    authUser.userId,
                    typeof req.body.name === "string"
                        ? req.body.name
                        : "",
                    typeof req.body.description === "string"
                        ? req.body.description
                        : null,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(201).json(result.value);
    }

    async list(
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
            await this.listCoachSquadsUseCase.execute(
                new ListCoachSquadsQuery(
                    authUser.tenantId,
                    authUser.userId,
                ),
            );

        res.status(200).json(result.value);
    }

    async update(
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
            await this.updateCoachSquadUseCase.execute(
                new UpdateCoachSquadCommand(
                    String(req.params.id),
                    authUser.tenantId,
                    authUser.userId,
                    typeof req.body.name === "string"
                        ? req.body.name
                        : "",
                    typeof req.body.description === "string"
                        ? req.body.description
                        : null,
                ),
            );

        if (!result.isSuccess) {
            const status =
                result.error === "Coach squad not found."
                    ? 404
                    : 400;

            res.status(status).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }
}
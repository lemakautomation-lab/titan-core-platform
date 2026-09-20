import { Response } from "express";

import { CreateCoachTeamCommand } from "../../application/commands/create-coach-team.command";
import { UpdateCoachTeamCommand } from "../../application/commands/update-coach-team.command";
import { ListCoachTeamsQuery } from "../../application/queries/coach/list-coach-teams.query";

import { CreateCoachTeamUseCase } from "../../application/use-cases/create-coach-team.use-case";
import { ListCoachTeamsUseCase } from "../../application/use-cases/list-coach-teams.use-case";
import { UpdateCoachTeamUseCase } from "../../application/use-cases/update-coach-team.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class CoachTeamController {
    constructor(
        private readonly createCoachTeamUseCase:
            CreateCoachTeamUseCase,
        private readonly listCoachTeamsUseCase:
            ListCoachTeamsUseCase,
        private readonly updateCoachTeamUseCase:
            UpdateCoachTeamUseCase,
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
            await this.createCoachTeamUseCase.execute(
                new CreateCoachTeamCommand(
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
            await this.listCoachTeamsUseCase.execute(
                new ListCoachTeamsQuery(
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
            await this.updateCoachTeamUseCase.execute(
                new UpdateCoachTeamCommand(
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
                result.error === "Coach team not found."
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
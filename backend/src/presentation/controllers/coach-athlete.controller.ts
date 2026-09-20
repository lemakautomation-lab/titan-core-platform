import { Response } from "express";

import { AddMyCoachAthleteCommand } from "../../application/commands/add-my-coach-athlete.command";
import { RemoveMyCoachAthleteCommand } from "../../application/commands/remove-my-coach-athlete.command";
import { ListMyCoachAthletesQuery } from "../../application/queries/coach/list-my-coach-athletes.query";

import { AddMyCoachAthleteUseCase } from "../../application/use-cases/add-my-coach-athlete.use-case";
import { ListMyCoachAthletesUseCase } from "../../application/use-cases/list-my-coach-athletes.use-case";
import { RemoveMyCoachAthleteUseCase } from "../../application/use-cases/remove-my-coach-athlete.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class CoachAthleteController {
    constructor(
        private readonly addMyCoachAthleteUseCase: AddMyCoachAthleteUseCase,
        private readonly listMyCoachAthletesUseCase: ListMyCoachAthletesUseCase,
        private readonly removeMyCoachAthleteUseCase: RemoveMyCoachAthleteUseCase,
    ) {}

    async add(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.addMyCoachAthleteUseCase.execute(
            new AddMyCoachAthleteCommand(
                authUser.tenantId,
                authUser.userId,
                String(req.body.athleteId ?? ""),
            ),
        );

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(201).json({
            relationshipId: result.value,
        });
    }

    async list(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.listMyCoachAthletesUseCase.execute(
            new ListMyCoachAthletesQuery(
                authUser.tenantId,
                authUser.userId,
            ),
        );

        res.status(200).json(result.value);
    }

    async remove(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.removeMyCoachAthleteUseCase.execute(
            new RemoveMyCoachAthleteCommand(
                authUser.tenantId,
                authUser.userId,
                String(req.params.athleteId),
            ),
        );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(204).send();
    }
}
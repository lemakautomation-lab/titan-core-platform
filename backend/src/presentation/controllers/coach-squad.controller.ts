import { Response } from "express";

import { CreateCoachSquadCommand } from "../../application/commands/create-coach-squad.command";
import { UpdateCoachSquadCommand } from "../../application/commands/update-coach-squad.command";
import { ListCoachSquadsQuery } from "../../application/queries/coach/list-coach-squads.query";

import { CreateCoachSquadUseCase } from "../../application/use-cases/create-coach-squad.use-case";
import { ListCoachSquadsUseCase } from "../../application/use-cases/list-coach-squads.use-case";
import { UpdateCoachSquadUseCase } from "../../application/use-cases/update-coach-squad.use-case";
import { AddCoachSquadAthleteUseCase } from "../../application/use-cases/add-coach-squad-athlete.use-case";
import { ListCoachSquadAthletesUseCase } from "../../application/use-cases/list-coach-squad-athletes.use-case";
import { RemoveCoachSquadAthleteUseCase } from "../../application/use-cases/remove-coach-squad-athlete.use-case";
import { GetCoachSquadPerformanceDashboardUseCase } from "../../application/use-cases/get-coach-squad-performance-dashboard.use-case";
import { GetCoachSquadIndividualComparisonUseCase } from "../../application/use-cases/get-coach-squad-individual-comparison.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class CoachSquadController {
    constructor(
        private readonly createCoachSquadUseCase:
            CreateCoachSquadUseCase,
        private readonly listCoachSquadsUseCase:
            ListCoachSquadsUseCase,
        private readonly updateCoachSquadUseCase:
            UpdateCoachSquadUseCase,
        private readonly addCoachSquadAthleteUseCase:
            AddCoachSquadAthleteUseCase,
        private readonly listCoachSquadAthletesUseCase:
            ListCoachSquadAthletesUseCase,
        private readonly removeCoachSquadAthleteUseCase:
            RemoveCoachSquadAthleteUseCase,
        private readonly getCoachSquadPerformanceDashboardUseCase:
            GetCoachSquadPerformanceDashboardUseCase,
        private readonly getCoachSquadIndividualComparisonUseCase:
            GetCoachSquadIndividualComparisonUseCase,
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

    async addAthlete(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.addCoachSquadAthleteUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                squadId: String(req.params.id),
                athleteId:
                    typeof req.body.athleteId === "string"
                        ? req.body.athleteId
                        : "",
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Coach squad not found." ||
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(201).json(result.value);
    }

    async listAthletes(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.listCoachSquadAthletesUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                squadId: String(req.params.id),
            });

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async removeAthlete(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.removeCoachSquadAthleteUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                squadId: String(req.params.id),
                athleteId: String(req.params.athleteId),
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Coach squad not found." ||
                result.error === "Squad athlete membership not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(204).send();
    }
    async performanceDashboard(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const rawLimit = req.query.limit;
        const limit =
            rawLimit === undefined
                ? 25
                : Number(rawLimit);

        const result =
            await this.getCoachSquadPerformanceDashboardUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                squadId: String(req.params.id),
                limit,
            });

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
    async individualComparison(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const rawLimit = req.query.limit;
        const limit =
            rawLimit === undefined
                ? 25
                : Number(rawLimit);

        const result =
            await this.getCoachSquadIndividualComparisonUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                squadId: String(req.params.id),
                athleteAId:
                    typeof req.query.athleteAId === "string"
                        ? req.query.athleteAId
                        : "",
                athleteBId:
                    typeof req.query.athleteBId === "string"
                        ? req.query.athleteBId
                        : "",
                limit,
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Coach squad not found." ||
                result.error ===
                    "Comparison athlete not found in squad."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
        }
}

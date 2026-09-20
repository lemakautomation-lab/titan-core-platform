import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";
import { CreateWorkoutProgrammeCommand } from "../../application/commands/create-workout-programme.command";
import { AssignTrainerWorkoutProgrammeCommand } from "../../application/commands/assign-trainer-workout-programme.command";
import { CreateCoachWorkoutProgrammeUseCase } from "../../application/use-cases/create-coach-workout-programme.use-case";
import { AssignCoachWorkoutProgrammeUseCase } from "../../application/use-cases/assign-coach-workout-programme.use-case";
import { GetCoachAthleteMonitoringUseCase } from "../../application/use-cases/get-coach-athlete-monitoring.use-case";

export class CoachTrainingController {
    constructor(
        private readonly createCoachWorkoutProgrammeUseCase:
            CreateCoachWorkoutProgrammeUseCase,
        private readonly assignCoachWorkoutProgrammeUseCase:
            AssignCoachWorkoutProgrammeUseCase,
        private readonly getCoachAthleteMonitoringUseCase:
            GetCoachAthleteMonitoringUseCase,
    ) {}

    async create(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.createCoachWorkoutProgrammeUseCase.execute(
                new CreateWorkoutProgrammeCommand(
                    authUser.tenantId,
                    authUser.userId,
                    String(req.body.athleteId),
                    String(req.body.name),
                    req.body.description ?? null,
                    String(req.body.goal),
                    String(req.body.experience),
                    Number(req.body.trainingFrequency),
                    Number(req.body.sessionDurationMinutes),
                    req.body.sportId ?? null,
                ),
            );

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found." ||
                result.error === "Sport not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(201).json(result.value);
    }

    async assign(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.assignCoachWorkoutProgrammeUseCase.execute(
                new AssignTrainerWorkoutProgrammeCommand(
                    String(req.params.id),
                    authUser.tenantId,
                    authUser.userId,
                    typeof req.body.athleteId === "string"
                        ? req.body.athleteId
                        : "",
                ),
            );

        if (!result.isSuccess) {
            const status =
                result.error === "Workout Programme not found." ||
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async monitoring(
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
            await this.getCoachAthleteMonitoringUseCase.execute({
                tenantId: authUser.tenantId,
                userId: authUser.userId,
                athleteId: String(req.params.athleteId),
                limit,
            });

        if (!result.isSuccess) {
            const status =
                result.error === "Athlete not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }}
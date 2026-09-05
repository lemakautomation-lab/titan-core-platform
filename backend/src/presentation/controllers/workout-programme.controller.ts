import { NextFunction, Response } from "express";

import { CreateWorkoutProgrammeCommand } from "../../application/commands/create-workout-programme.command";
import { UpdateWorkoutProgrammeCommand } from "../../application/commands/update-workout-programme.command";
import { DeleteWorkoutProgrammeCommand } from "../../application/commands/delete-workout-programme.command";
import { UpdateWorkoutProgrammeStatusCommand } from "../../application/commands/update-workout-programme-status.command";
import { AdaptWorkoutProgrammeFromPerformanceCommand } from "../../application/commands/adapt-workout-programme-from-performance.command";

import { GetWorkoutProgrammeByIdQuery } from "../../application/queries/workout-programme/get-workout-programme-by-id.query";
import { ListWorkoutProgrammesQuery } from "../../application/queries/workout-programme/list-workout-programmes.query";
import { ListWorkoutProgrammesByAthleteQuery } from "../../application/queries/workout-programme/list-workout-programmes-by-athlete.query";

import { CreateWorkoutProgrammeUseCase } from "../../application/use-cases/create-workout-programme.use-case";
import { GetWorkoutProgrammeByIdUseCase } from "../../application/use-cases/get-workout-programme-by-id.use-case";
import { ListWorkoutProgrammesUseCase } from "../../application/use-cases/list-workout-programmes.use-case";
import { ListWorkoutProgrammesByAthleteUseCase } from "../../application/use-cases/list-workout-programmes-by-athlete.use-case";
import { UpdateWorkoutProgrammeUseCase } from "../../application/use-cases/update-workout-programme.use-case";
import { DeleteWorkoutProgrammeUseCase } from "../../application/use-cases/delete-workout-programme.use-case";
import { UpdateWorkoutProgrammeStatusUseCase } from "../../application/use-cases/update-workout-programme-status.use-case";
import { AdaptWorkoutProgrammeFromPerformanceUseCase } from "../../application/use-cases/adapt-workout-programme-from-performance.use-case";
import { GenerateWorkoutProgrammeUseCase } from "../../application/use-cases/generate-workout-programme.use-case";
import { GetGeneratedWorkoutProgrammeUseCase } from "../../application/use-cases/get-generated-workout-programme.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePagination } from "../../application/common/pagination";
import { GenerateWorkoutProgrammeRequestDto } from "../dto/generate-workout-programme-request.dto";
import { ProgrammeGenerationHttpErrorMapper } from "../errors/programme-generation-http-error.mapper";
import { GeneratedWorkoutProgrammeResponseMapper } from "../mappers/generated-workout-programme-response.mapper";
import { GetGeneratedWorkoutProgrammeRequestDto } from "../dto/get-generated-workout-programme-request.dto";
import { HttpException } from "../../shared/exceptions/http.exception";

export class WorkoutProgrammeController {
    constructor(
        private readonly createWorkoutProgrammeUseCase: CreateWorkoutProgrammeUseCase,
        private readonly getWorkoutProgrammeByIdUseCase: GetWorkoutProgrammeByIdUseCase,
        private readonly listWorkoutProgrammesUseCase: ListWorkoutProgrammesUseCase,
        private readonly listWorkoutProgrammesByAthleteUseCase: ListWorkoutProgrammesByAthleteUseCase,
        private readonly updateWorkoutProgrammeUseCase: UpdateWorkoutProgrammeUseCase,
        private readonly deleteWorkoutProgrammeUseCase: DeleteWorkoutProgrammeUseCase,
        private readonly updateWorkoutProgrammeStatusUseCase: UpdateWorkoutProgrammeStatusUseCase,
        private readonly adaptWorkoutProgrammeFromPerformanceUseCase: AdaptWorkoutProgrammeFromPerformanceUseCase,
        private readonly generateWorkoutProgrammeUseCase: GenerateWorkoutProgrammeUseCase,
        private readonly getGeneratedWorkoutProgrammeUseCase: GetGeneratedWorkoutProgrammeUseCase,
    ) {}

    async generate(
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const authUser = req.user;
        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        try {
            const request = GenerateWorkoutProgrammeRequestDto.toApplicationRequest(
                req.body,
                req.headers["idempotency-key"],
                authUser.tenantId,
                authUser.userId,
            );
            const outcome = await this.generateWorkoutProgrammeUseCase.execute(request);
            res.status(outcome.status === "created" ? 201 : 200).json(
                GeneratedWorkoutProgrammeResponseMapper.toResponse(outcome),
            );
        } catch (error) {
            next(ProgrammeGenerationHttpErrorMapper.map(error) ?? error);
        }
    }

    async getGeneratedById(
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        const authUser = req.user;
        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        try {
            const query = GetGeneratedWorkoutProgrammeRequestDto.toQuery(
                req.params.generationId,
                authUser.tenantId,
            );
            const result =
                await this.getGeneratedWorkoutProgrammeUseCase.execute(query);
            if (!result.isSuccess || !result.value) {
                throw new HttpException(
                    "Generated Workout Programme not found.",
                    404,
                    "GENERATED_PROGRAMME_NOT_FOUND",
                );
            }
            res.status(200).json(
                GeneratedWorkoutProgrammeResponseMapper.toRetrievalResponse(
                    result.value,
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async adaptFromPerformance(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.adaptWorkoutProgrammeFromPerformanceUseCase.execute(
                new AdaptWorkoutProgrammeFromPerformanceCommand(
                    String(req.params.id),
                    authUser.tenantId,
                    authUser.userId,
                    typeof req.body.athleteId === "string"
                        ? req.body.athleteId
                        : "",
                    typeof req.body.metricId === "string"
                        ? req.body.metricId
                        : "",
                    Number(req.body.trainingFrequencyDelta),
                    Number(req.body.sessionDurationMinutesDelta),
                    typeof req.body.rationale === "string"
                        ? req.body.rationale
                        : "",
                ),
            );

        if (!result.isSuccess) {
            if (
                result.error ===
                "Unable to adapt Workout Programme from performance evidence."
            ) {
                res.status(500).json({
                    error: "Unable to adapt Workout Programme.",
                });
                return;
            }

            const notFoundErrors = [
                "Workout Programme not found.",
                "Athlete not found.",
                "Performance metric not found.",
                "Recent performance measurement evidence is required.",
            ];

            res.status(
                notFoundErrors.includes(result.error ?? "")
                    ? 404
                    : 400,
            ).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async create(req: AuthRequest, res: Response): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.createWorkoutProgrammeUseCase.execute(
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

    async getById(req: AuthRequest, res: Response): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.getWorkoutProgrammeByIdUseCase.execute(
            new GetWorkoutProgrammeByIdQuery(
                String(req.params.id),
                authUser.tenantId,
            ),
        );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async list(req: AuthRequest, res: Response): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        let pagination;

        try {
            pagination = parsePagination(
                req.query.page,
                req.query.pageSize,
            );
        } catch (error) {
            res.status(400).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Invalid pagination parameters.",
            });
            return;
        }

        const result = await this.listWorkoutProgrammesUseCase.execute(
            new ListWorkoutProgrammesQuery(
                authUser.tenantId,
                pagination,
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

        res.status(200).json(result.value);
    }

    async listByAthlete(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.listWorkoutProgrammesByAthleteUseCase.execute(
                new ListWorkoutProgrammesByAthleteQuery(
                    String(req.params.athleteId),
                    authUser.tenantId,
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json({
            data: result.value,
        });
    }

    async update(req: AuthRequest, res: Response): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.updateWorkoutProgrammeUseCase.execute(
            new UpdateWorkoutProgrammeCommand(
                String(req.params.id),
                authUser.tenantId,
                authUser.userId,
                String(req.body.athleteId),
                String(req.body.name),
                req.body.description ?? null,
                req.body.goal,
                req.body.experience,
                Number(req.body.trainingFrequency),
                Number(req.body.sessionDurationMinutes),
                req.body.sportId ?? null,
            ),
        );

        if (!result.isSuccess) {
            const status =
                result.error === "Workout Programme not found." ||
                result.error === "Athlete not found." ||
                result.error === "Sport not found."
                    ? 404
                    : 400;

            res.status(status).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }


    async updateStatus(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.updateWorkoutProgrammeStatusUseCase.execute(
                new UpdateWorkoutProgrammeStatusCommand(
                    String(req.params.id),
                    authUser.tenantId,
                    authUser.userId,
                    req.body.status,
                ),
            );

        if (!result.isSuccess) {
            const status =
                result.error === "Workout Programme not found."
                    ? 404
                    : 400;

            res.status(status).json({
                error: result.error,
            });

            return;
        }

        res.status(204).send();
    }
    async delete(req: AuthRequest, res: Response): Promise<void> {
        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result = await this.deleteWorkoutProgrammeUseCase.execute(
            new DeleteWorkoutProgrammeCommand(
                String(req.params.id),
                authUser.tenantId,
                authUser.userId,
            ),
        );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(204).send();
    }
}

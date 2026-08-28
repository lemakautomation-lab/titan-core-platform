import { Response } from "express";

import { CreateExerciseCommand } from "../../application/commands/create-exercise.command";
import { UpdateExerciseCommand } from "../../application/commands/update-exercise.command";
import { DeleteExerciseCommand } from "../../application/commands/delete-exercise.command";

import { GetExerciseByIdQuery } from "../../application/queries/exercise/get-exercise-by-id.query";
import { ListExercisesQuery } from "../../application/queries/exercise/list-exercises.query";

import { CreateExerciseUseCase } from "../../application/use-cases/create-exercise.use-case";
import { GetExerciseByIdUseCase } from "../../application/use-cases/get-exercise-by-id.use-case";
import { ListExercisesUseCase } from "../../application/use-cases/list-exercises.use-case";
import { UpdateExerciseUseCase } from "../../application/use-cases/update-exercise.use-case";
import { DeleteExerciseUseCase } from "../../application/use-cases/delete-exercise.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class ExerciseController {

    constructor(
        private readonly createExerciseUseCase: CreateExerciseUseCase,
        private readonly getExerciseByIdUseCase: GetExerciseByIdUseCase,
        private readonly listExercisesUseCase: ListExercisesUseCase,
        private readonly updateExerciseUseCase: UpdateExerciseUseCase,
        private readonly deleteExerciseUseCase: DeleteExerciseUseCase,
    ) {}

    async create(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.createExerciseUseCase.execute(
                new CreateExerciseCommand(
                    String(req.body.name),
                    String(req.body.slug),
                    req.body.description ?? null,
                    String(req.body.movement),
                    Array.isArray(req.body.muscleGroups)
                        ? req.body.muscleGroups
                        : [],
                    Array.isArray(req.body.equipment)
                        ? req.body.equipment
                        : [],
                    String(req.body.trainingObjective),
                    String(req.body.difficulty),
                    req.body.trainingPhase ?? null,
                    req.body.sportId ?? null,
                    authUser.tenantId,
                    authUser.userId,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({ error: result.error });
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

        const result =
            await this.getExerciseByIdUseCase.execute(
                new GetExerciseByIdQuery(
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

        const result =
            await this.listExercisesUseCase.execute(
                new ListExercisesQuery(
                    authUser.tenantId,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async update(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.updateExerciseUseCase.execute(
                new UpdateExerciseCommand(
                    String(req.params.id),
                    String(req.body.name),
                    String(req.body.slug),
                    req.body.description ?? null,
                    String(req.body.movement),
                    Array.isArray(req.body.muscleGroups)
                        ? req.body.muscleGroups
                        : [],
                    Array.isArray(req.body.equipment)
                        ? req.body.equipment
                        : [],
                    String(req.body.trainingObjective),
                    String(req.body.difficulty),
                    req.body.trainingPhase ?? null,
                    req.body.sportId ?? null,
                    authUser.tenantId,
                    authUser.userId,
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.deleteExerciseUseCase.execute(
                new DeleteExerciseCommand(
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

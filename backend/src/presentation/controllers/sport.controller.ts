import { Response } from "express";

import { CreateSportCommand } from "../../application/commands/create-sport.command";
import { UpdateSportCommand } from "../../application/commands/update-sport.command";
import { DeleteSportCommand } from "../../application/commands/delete-sport.command";

import { GetSportByIdQuery } from "../../application/queries/sport/get-sport-by-id.query";
import { ListSportsQuery } from "../../application/queries/sport/list-sports.query";

import { CreateSportUseCase } from "../../application/use-cases/create-sport.use-case";
import { GetSportByIdUseCase } from "../../application/use-cases/get-sport-by-id.use-case";
import { ListSportsUseCase } from "../../application/use-cases/list-sports.use-case";
import { UpdateSportUseCase } from "../../application/use-cases/update-sport.use-case";
import { DeleteSportUseCase } from "../../application/use-cases/delete-sport.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

export class SportController {

    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportByIdUseCase: GetSportByIdUseCase,
        private readonly listSportsUseCase: ListSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async create(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.createSportUseCase.execute(
                new CreateSportCommand(
                    String(req.body.name),
                    String(req.body.slug),
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
            await this.getSportByIdUseCase.execute(
                new GetSportByIdQuery(
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
            await this.listSportsUseCase.execute(
                new ListSportsQuery(
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
            await this.updateSportUseCase.execute(
                new UpdateSportCommand(
                    String(req.params.id),
                    String(req.body.name),
                    String(req.body.slug),
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
            await this.deleteSportUseCase.execute(
                new DeleteSportCommand(
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

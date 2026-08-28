import { Response } from "express";

import { CreateAthleteRelationshipCommand } from "../../application/commands/create-athlete-relationship.command";

import { GetAthleteRelationshipByIdQuery } from "../../application/queries/athlete-relationship/get-athlete-relationship-by-id.query";
import { ListAthleteRelationshipsQuery } from "../../application/queries/athlete-relationship/list-athlete-relationships.query";

import { CreateAthleteRelationshipUseCase } from "../../application/use-cases/create-athlete-relationship.use-case";
import { GetAthleteRelationshipByIdUseCase } from "../../application/use-cases/get-athlete-relationship-by-id.use-case";
import { ListAthleteRelationshipsUseCase } from "../../application/use-cases/list-athlete-relationships.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePagination } from "../../application/common/pagination";


export class AthleteRelationshipController {

    constructor(

        private readonly createAthleteRelationshipUseCase:
            CreateAthleteRelationshipUseCase,

        private readonly getAthleteRelationshipByIdUseCase:
            GetAthleteRelationshipByIdUseCase,

        private readonly listAthleteRelationshipsUseCase:
            ListAthleteRelationshipsUseCase,

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
            new CreateAthleteRelationshipCommand(
                authUser.tenantId,
                String(req.body.athleteId),
                req.body.relationshipType,
                String(req.body.relatedEntityId),
                new Date(req.body.startsAt),
            );

        const result =
            await this.createAthleteRelationshipUseCase.execute(
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
            await this.getAthleteRelationshipByIdUseCase.execute(
                new GetAthleteRelationshipByIdQuery(
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

        let pagination;

        try {
            pagination =
                parsePagination(
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

        const result =
            await this.listAthleteRelationshipsUseCase.execute(
                new ListAthleteRelationshipsQuery(
                    String(req.params.athleteId),
                    authUser.tenantId,
                    pagination,
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


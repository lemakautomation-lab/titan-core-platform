import { Response } from "express";

import { CreatePerformanceMetricUseCase } from "../../application/use-cases/create-performance-metric.use-case";
import { GetPerformanceMetricByIdUseCase } from "../../application/use-cases/get-performance-metric-by-id.use-case";
import { ListPerformanceMetricsUseCase } from "../../application/use-cases/list-performance-metrics.use-case";
import { UpdatePerformanceMetricUseCase } from "../../application/use-cases/update-performance-metric.use-case";
import { DeletePerformanceMetricUseCase } from "../../application/use-cases/delete-performance-metric.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePagination } from "../../application/common/pagination";

import { UpdatePerformanceMetricCommand } from "../../application/commands/update-performance-metric.command";
import { DeletePerformanceMetricCommand } from "../../application/commands/delete-performance-metric.command";

import { GetPerformanceMetricByIdQuery } from "../../application/queries/performance-metric/get-performance-metric-by-id.query";
import { PerformanceMetricMapper } from "../../application/mappers/performance-metric.mapper";

export class PerformanceMetricController {

    constructor(
        private readonly createPerformanceMetricUseCase: CreatePerformanceMetricUseCase,
        private readonly getPerformanceMetricByIdUseCase: GetPerformanceMetricByIdUseCase,
        private readonly listPerformanceMetricsUseCase: ListPerformanceMetricsUseCase,
        private readonly updatePerformanceMetricUseCase: UpdatePerformanceMetricUseCase,
        private readonly deletePerformanceMetricUseCase: DeletePerformanceMetricUseCase,
    ) {}

    async create(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.createPerformanceMetricUseCase.execute({
                tenantId: authUser.tenantId,
                athleteId: String(req.body.athleteId),
                sportId: String(req.body.sportId),
                name: String(req.body.name),
                slug: String(req.body.slug),
                description: req.body.description,
                unit: req.body.unit,
                dataType: String(req.body.dataType),
            });

        res.status(201).json(
            PerformanceMetricMapper.toDto(result),
        );
    }

    async getById(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const query: GetPerformanceMetricByIdQuery = {
            id: String(req.params.id),
            tenantId: authUser.tenantId,
        };

        const result =
            await this.getPerformanceMetricByIdUseCase.execute(query);

        if (!result) {
            res.status(404).json({
                error: "Performance metric not found",
            });
            return;
        }

        res.status(200).json(result);
    }

    async list(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
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
            await this.listPerformanceMetricsUseCase.execute({
                tenantId: authUser.tenantId,
                page: pagination.page,
                pageSize: pagination.pageSize,
            });

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
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

        const command: UpdatePerformanceMetricCommand = {
            id: String(req.params.id),
            tenantId: authUser.tenantId,
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description,
            unit: req.body.unit,
            dataType: req.body.dataType,
        };

        const result =
            await this.updatePerformanceMetricUseCase.execute(command);

        res.status(200).json(result);
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const command: DeletePerformanceMetricCommand = {
            id: String(req.params.id),
            tenantId: authUser.tenantId,
        };

        try {
            await this.deletePerformanceMetricUseCase.execute(command);

            res.status(204).send();
        } catch (error) {
            res.status(404).json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Performance metric not found",
            });
        }
    }
}

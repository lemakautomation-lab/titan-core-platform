import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import { CreateTenantCommand } from "../../application/commands/create-tenant.command";
import { UpdateTenantCommand } from "../../application/commands/update-tenant.command";
import { DeleteTenantCommand } from "../../application/commands/delete-tenant.command";

import { GetTenantByIdQuery } from "../../application/queries/tenant/get-tenant-by-id.query";
import { ListTenantsQuery } from "../../application/queries/tenant/list-tenants.query";

import { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import { GetTenantByIdUseCase } from "../../application/use-cases/get-tenant-by-id.use-case";
import { ListTenantsUseCase } from "../../application/use-cases/list-tenants.use-case";
import { UpdateTenantUseCase } from "../../application/use-cases/update-tenant.use-case";
import { DeleteTenantUseCase } from "../../application/use-cases/delete-tenant.use-case";

export class TenantController {

    constructor(
        private readonly createTenantUseCase: CreateTenantUseCase,
        private readonly getTenantByIdUseCase: GetTenantByIdUseCase,
        private readonly listTenantsUseCase: ListTenantsUseCase,
        private readonly updateTenantUseCase: UpdateTenantUseCase,
        private readonly deleteTenantUseCase: DeleteTenantUseCase,
    ) {}

    async create(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const command = new CreateTenantCommand(
            req.body.name,
        );

        const result =
            await this.createTenantUseCase.execute(command);

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(201).json(result.value);
    }

    async getById(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const tenantId = String(req.params.id);

        if (tenantId !== authUser.tenantId) {
            res.status(404).json({
                error: "Tenant not found.",
            });
            return;
        }

        const query = new GetTenantByIdQuery(
            tenantId,
        );

        const result =
            await this.getTenantByIdUseCase.execute(query);

        if (!result.isSuccess) {
            res.status(404).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async list(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const result =
            await this.listTenantsUseCase.execute(
                new ListTenantsQuery(),
            );

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
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const tenantId = String(req.params.id);

        if (tenantId !== authUser.tenantId) {
            res.status(404).json({
                error: "Tenant not found.",
            });
            return;
        }

        const name = String(req.body.name);

        const slug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const command = new UpdateTenantCommand(
            tenantId,
            name,
            slug,
        );

        const result =
            await this.updateTenantUseCase.execute(command);

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const tenantId = String(req.params.id);

        if (tenantId !== authUser.tenantId) {
            res.status(404).json({
                error: "Tenant not found.",
            });
            return;
        }

        const command = new DeleteTenantCommand(
            tenantId,
        );

        const result =
            await this.deleteTenantUseCase.execute(command);

        if (!result.isSuccess) {
            res.status(404).json({
                error: result.error,
            });
            return;
        }

        res.status(204).send();
    }
}

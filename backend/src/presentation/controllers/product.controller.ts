import { Response } from "express";

import { CreateProductCommand } from "../../application/commands/create-product.command";
import { UpdateProductCommand } from "../../application/commands/update-product.command";
import { DeleteProductCommand } from "../../application/commands/delete-product.command";

import { GetProductByIdQuery } from "../../application/queries/product/get-product-by-id.query";
import { ListProductsQuery } from "../../application/queries/product/list-products.query";

import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { GetProductByIdUseCase } from "../../application/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "../../application/use-cases/list-products.use-case";
import { UpdateProductUseCase } from "../../application/use-cases/update-product.use-case";
import { DeleteProductUseCase } from "../../application/use-cases/delete-product.use-case";

import { AuthRequest } from "../../middleware/auth.middleware";

function validateProductBody(body: unknown): string | null {

    if (!body || typeof body !== "object") {
        return "Invalid product payload.";
    }

    const input = body as Record<string, unknown>;

    if (
        typeof input.name !== "string" ||
        input.name.trim().length === 0
    ) {
        return "Product name is required.";
    }

    if (
        typeof input.slug !== "string" ||
        input.slug.trim().length === 0
    ) {
        return "Product slug is required.";
    }

    if (
        typeof input.priceCents !== "number" ||
        !Number.isInteger(input.priceCents) ||
        input.priceCents < 0
    ) {
        return "Product priceCents must be a non-negative integer.";
    }

    if (
        typeof input.currency !== "string" ||
        input.currency.trim().length !== 3
    ) {
        return "Product currency must be a 3-character code.";
    }

    if (
        input.billingInterval !== "MONTHLY" &&
        input.billingInterval !== "QUARTERLY" &&
        input.billingInterval !== "ANNUALLY" &&
        input.billingInterval !== "ONE_TIME"
    ) {
        return "Invalid billing interval.";
    }

    if (
        input.description !== undefined &&
        input.description !== null &&
        typeof input.description !== "string"
    ) {
        return "Product description must be a string or null.";
    }

    return null;
}

export class ProductController {

    constructor(
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly getProductByIdUseCase: GetProductByIdUseCase,
        private readonly listProductsUseCase: ListProductsUseCase,
        private readonly updateProductUseCase: UpdateProductUseCase,
        private readonly deleteProductUseCase: DeleteProductUseCase,
    ) {}

    async create(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const validationError =
            validateProductBody(req.body);

        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        const result =
            await this.createProductUseCase.execute(
                new CreateProductCommand(
                    req.user.tenantId,
                    req.body.name.trim(),
                    req.body.slug.trim(),
                    req.body.description ?? null,
                    req.body.priceCents,
                    req.body.currency.trim(),
                    req.body.billingInterval,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({ error: result.error });
            return;
        }

        res.status(201).json(result.value);
    }

    async getById(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.getProductByIdUseCase.execute(
                new GetProductByIdQuery(
                    req.user.tenantId,
                    String(req.params.id),
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async list(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.listProductsUseCase.execute(
                new ListProductsQuery(
                    req.user.tenantId,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async update(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const validationError =
            validateProductBody(req.body);

        if (validationError) {
            res.status(400).json({ error: validationError });
            return;
        }

        const result =
            await this.updateProductUseCase.execute(
                new UpdateProductCommand(
                    req.user.tenantId,
                    String(req.params.id),
                    req.body.name.trim(),
                    req.body.slug.trim(),
                    req.body.description ?? null,
                    req.body.priceCents,
                    req.body.currency.trim(),
                    req.body.billingInterval,
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {

        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const result =
            await this.deleteProductUseCase.execute(
                new DeleteProductCommand(
                    req.user.tenantId,
                    String(req.params.id),
                ),
            );

        if (!result.isSuccess) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(204).send();
    }
}
